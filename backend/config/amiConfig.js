// /ami/handler.js (Example file path)
const CallLog = require("../models/callLog.js");
const Queue = require("../models/queue.js");

let queueNameMap = {};
 async function loadQueueNamesMap() {
  const queues = await Queue.find({}, { queueId: 1, name: 1 }).lean();
  const map = {};
  queues.forEach(q => {
    map[q.queueId] = q.name;
  });
  queueNameMap = map;
}

// Centralized in-memory state for the application
const state = {

  ongoingCalls: {},  // Tracks active, answered calls by linkedId
  activeRinging: {}, // Tracks calls that are currently ringing but not yet answered
  queueData: {},     // Stores parameters for each queue
  queueMembers: {},  // Stores members of each queue
  queueCallers: {},  // Stores callers waiting in each queue
  endpointList: [],  // Temporarily holds endpoint data during collection
};

// --- HELPER FUNCTIONS ---

/**
 * A centralized function to update the call log in the database.
 * This reduces code repetition and centralizes error handling.
 * @param {string} linkedId - The unique ID of the call.
 * @param {object} updateData - The data to update in the database.
 * @param {object} [options={}] - Optional Mongoose `findOneAndUpdate` options.
 */
async function updateCallLog(linkedId, updateData, options = {}) {
  try {
    await CallLog.findOneAndUpdate({ linkedId }, updateData, { ...options, new: true });
    // console.log(`Call log updated for ${linkedId}:`, updateData);
  } catch (err) {
    console.error(`Error updating call log for linkedId ${linkedId}:`, err);
  }
}

/**
 * Emits the current queue caller status to all clients.
 * Calculates wait times on the fly.
 * @param {object} io - The Socket.IO server instance.
 */
function emitQueueCallersStatus(io) {
  const data = Object.entries(state.queueCallers).reduce(
    (acc, [queue, callers]) => {
      acc[queue] = callers.map((c) => ({
        ...c,
        waitTime: Math.floor((Date.now() - c.waitStart) / 1000),
      }));
      return acc;
    }, {}
  );
  io.emit("queueStatus", data);
}

// --- CALL LIFECYCLE EVENT HANDLERS ---

/**
 * Handles the 'DialBegin' event when a call starts ringing.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 */
function handleDialBegin(event, io) {
  const { Linkedid, CallerIDNum, CallerIDName, DestExten, DialString, DestChannel } = event;

  if (!state.activeRinging[Linkedid]) {
    state.activeRinging[Linkedid] = {
      callInfo: {
        callerId: CallerIDNum,
        callerName: CallerIDName,
        destination: DestExten,
      },
      ringingChannels: new Set(),
    };
  }

  state.activeRinging[Linkedid].ringingChannels.add(DestChannel);
  console.log(`📞 Ringing started on ${DestChannel} for call ${Linkedid}`);

  updateCallLog(
    Linkedid,
    {
      linkedId: Linkedid,
      callerId: CallerIDNum,
      callerName: CallerIDName,
      callee: DestExten,
      startTime: new Date(),
      status: "ringing",
      channels: [DestChannel],
      direction: DialString && DialString.startsWith("PJSIP/") ? "outbound" : "inbound",
    },
    { upsert: true } // Create the document if it doesn't exist
  );
}

const handleQueueStatus = (event) => {
  // console.log("QueueStatus Event:", event);
}

/**
 * Handles the 'BridgeEnter' event when a call is answered.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 */
function handleBridgeEnter(event, io) {
  const { Linkedid, CallerIDNum, CallerIDName, ConnectedLineNum, ConnectedLineName, Channel1, Channel2 } = event;

  // ... (check for state.activeRinging[Linkedid]) ...

  state.ongoingCalls[Linkedid] = {
    caller: CallerIDNum,       // '007'
    callerName: CallerIDName,   // 'Jhon whick'
    agent: ConnectedLineNum,    // '1001'
    agentName: ConnectedLineName, // 'Agent 1' (this is a good addition for the UI!)
    state: "Talking",
    startTime: Date.now(),      // Current timestamp when the bridge occurred
    channels: [Channel1, Channel2].filter(Boolean), // Will store relevant channels
  };

  // ... (delete from activeRinging) ...

  // updateCallLog(Linkedid, {
  //   answerTime: new Date(),
  //   status: "answered",
  //   callee: ConnectedLineNum,    // '1001'
  //   calleeName: ConnectedLineName, // 'Agent 1'
  //   $addToSet: { channels: { $each: [Channel1, Channel2].filter(Boolean) } },
  // });
  // console.log(on)
  // ⭐ This sends the updated list of ongoing calls to your frontend ⭐
  io.emit("ongoingCalls", Object.values(state.ongoingCalls));
}
/**
 * Handles the 'Hangup' event, consolidating all end-of-call logic.
 * This is the single source of truth for terminated calls.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 */
function handleHangup(event, io) {
  const { Linkedid, Channel, Cause, CauseTxt } = event;

  // Case 1: Call was hung up while ringing -> Missed Call
  if (state.activeRinging[Linkedid]?.ringingChannels.has(Channel)) {
    state.activeRinging[Linkedid].ringingChannels.delete(Channel);

    if (state.activeRinging[Linkedid].ringingChannels.size === 0) {
      console.log(`💔 Missed call ${Linkedid}`);
      io.emit("callState", { event: "missed", linkedId: Linkedid, data: state.activeRinging[Linkedid].callInfo });
      updateCallLog(Linkedid, { endTime: new Date(), status: "missed", hangupCause: Cause, hangupCauseTxt: CauseTxt });
      delete state.activeRinging[Linkedid];
    }
    return;
  }

  // Case 2: An answered call was hung up -> Ended, Busy, Failed etc.
  if (state.ongoingCalls[Linkedid]) {
    state.ongoingCalls[Linkedid].channels = state.ongoingCalls[Linkedid].channels.filter(c => c !== Channel);

    if (state.ongoingCalls[Linkedid].channels.length === 0) {
      const call = state.ongoingCalls[Linkedid];
      const duration = Math.floor((Date.now() - call.startTime) / 1000);

      let finalStatus = "ended";
      switch (String(Cause)) {
        case "17": finalStatus = "busy"; break;
        case "18":
        case "19": finalStatus = "unanswered"; break;
        case "21": finalStatus = "failed"; break;
      }
      
      console.log(`👋 Call ${Linkedid} ended. Status: ${finalStatus}, Duration: ${duration}s`);
      io.emit("callEnded", { ...call, endTime: Date.now(), duration });
      updateCallLog(Linkedid, { endTime: new Date(), duration, status: finalStatus, hangupCause: Cause, hangupCauseTxt: CauseTxt });
      

      //got him
      delete state.ongoingCalls[Linkedid];
      console.log("Ongoing calles Updated Debug", state.ongoingCalls);
      io.emit("ongoingCalls", Object.values(state.ongoingCalls));
    }
  }
}

function handleHold(event, io) {
  if (state.ongoingCalls[event.Linkedid]) {
    state.ongoingCalls[event.Linkedid].state = "On Hold";
    updateCallLog(event.Linkedid, { status: "on_hold" });
    console.log(state.ongoingCalls)
    io.emit("ongoingCalls", Object.values(state.ongoingCalls));
  }
}

function handleUnhold(event, io) {
  if (state.ongoingCalls[event.Linkedid]) {
    state.ongoingCalls[event.Linkedid].state = "Talking";
    updateCallLog(event.Linkedid, { status: "answered" });
    io.emit("ongoingCalls", Object.values(state.ongoingCalls));
  }
}


// --- QUEUE EVENT HANDLERS ---

function handleQueueParams(event) {
  state.queueData[event.Queue] = { name: event.Queue, ...event };
}

function handleQueueMember(event) {
  const { Queue, Location } = event;

  // Get human-readable queue name if available
  const readableQueueName = queueNameMap[Queue] || Queue;

  // Add queueName to the event
  event.queueName = readableQueueName;

  if (!state.queueMembers[Queue]) {
    state.queueMembers[Queue] = [];
  }

  const existingIndex = state.queueMembers[Queue].findIndex(m => m.Location === Location);

  if (existingIndex !== -1) {
    state.queueMembers[Queue][existingIndex] = event;
  } else {
    state.queueMembers[Queue].push(event);
  }
}


function handleQueueStatusComplete(io) {
    io.emit("queueUpdate", state.queueData);
    io.emit("queueMembers", state.queueMembers);
}

function handleQueueCallerJoin(event, io) {
    const { Queue, Uniqueid, CallerIDNum, Position } = event;
    if (!state.queueCallers[Queue]) state.queueCallers[Queue] = [];

    const alreadyExists = state.queueCallers[Queue].some(c => c.id === Uniqueid);
    if (!alreadyExists) {
        state.queueCallers[Queue].push({
            id: Uniqueid,
            caller_id: CallerIDNum,
            position: parseInt(Position),
            waitStart: Date.now(),
        });
    }
    emitQueueCallersStatus(io);
}

function handleQueueCallerLeave(event, io) {
    const { Queue, Uniqueid } = event;
    if (state.queueCallers[Queue]) {
        state.queueCallers[Queue] = state.queueCallers[Queue].filter(c => c.id !== Uniqueid);
    }
    emitQueueCallersStatus(io);
}


// --- ENDPOINT & AGENT STATUS HANDLERS ---

function handleEndpointList(event) {
    state.endpointList.push(event);
}

function handleEndpointListComplete(io) {
    io.emit("endpointList", state.endpointList);
    state.endpointList = []; // Reset for the next batch
}

function handleContactStatus(event, io) {
    const { EndpointName, ContactStatus } = event;
    let status = "";
    if (ContactStatus === "Reachable") status = "online";
    else if (ContactStatus === "Unreachable" || ContactStatus === "Removed") status = "offline";

    if (status) {
        // Here you would typically update an Agent/User model in your database
        // For now, we just emit the event
        io.emit("agentStatusUpdate", { agentId: EndpointName, status });
    }
}

// --- MAIN SETUP FUNCTION ---

/**
 * Sets up all Asterisk AMI event listeners.
 * This function should be called ONLY ONCE when your server starts.
 * @param {AmiClient} ami - The configured and connected AMI client instance.
 * @param {object} io - The Socket.IO server instance.
 */
async function setupAmiEventListeners(ami, io) {
  ami.setMaxListeners(50);
  await loadQueueNamesMap();
  // -- Register all event handlers --
  ami.on("DialBegin", (event) => handleDialBegin(event, io));
  ami.on("BridgeEnter", (event) => handleBridgeEnter(event, io));
  ami.on("Hangup", (event) => handleHangup(event, io));
  ami.on("Hold", (event) => handleHold(event, io));
  ami.on("Unhold", (event) => handleUnhold(event, io));

  // Queue Events
//   ami.on("QueueEntry",(event)=>{
//     console
// .log("QueueEntry Event received");
//     console.log("QueueEntry Event received", event);  
//   })
  ami.on("QueueParams", handleQueueParams);
  ami.on("QueueMember", handleQueueMember);
  ami.on("QueueStatus", handleQueueStatus)
  ami.on("QueueStatusComplete", () => handleQueueStatusComplete(io));
  ami.on("QueueCallerJoin", (event) => handleQueueCallerJoin(event, io));
  ami.on("QueueCallerLeave", (event) => handleQueueCallerLeave(event, io));
  ami.on("QueueCallerAbandon", (event) => handleQueueCallerLeave(event, io)); // Abandon is a type of leave

  // Endpoint/Agent Status Events
  ami.on("EndpointList", handleEndpointList);
  ami.on("EndpointListComplete", () => handleEndpointListComplete(io));
  ami.on("ContactStatus", (event) => handleContactStatus(event, io));
  
  // NOTE: The generic ami.on('event', ...) listener has been REMOVED for performance.
  // Its logic has been merged into the specific 'Hangup' handler.
  
  // -- Start periodic polling actions --
  setInterval(() => ami.action({ Action: "QueueStatus" }), 2000);
  setInterval(() => ami.action({ Action: "PJSIPShowEndpoints" }), 5000);

  console.log("✅ AMI event listeners registered and ready.");

  // It's better to handle socket-specific events outside this function,
  // in your main server file where you handle `io.on('connection', ...)`.
  // This avoids adding duplicate listeners.
}

module.exports = { setupAmiEventListeners, state,loadQueueNamesMap };