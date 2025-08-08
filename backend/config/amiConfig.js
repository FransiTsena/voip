// /ami/handler.js (Example file path)
const CallLog = require("../models/callLog.js");
const Queue = require("../models/queue.js");
const fs = require("fs");
const path = require("path");

const recordingsBasePath = "/var/spool/asterisk/monitor/insaRecordings";

if (!fs.existsSync(recordingsBasePath)) {
  fs.mkdirSync(recordingsBasePath, { recursive: true });
}
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
  ongoingCalls: {},
  activeRinging: {},
  queueData: {},
  queueMembers: {},
  queueCallers: [],
  endpointList: [],
  agentShifts: {},
  activeBridges: {},
  recordedLinkedIds: {},
};

// On startup, load all ongoing shifts and pending ends into memory
async function syncAgentShiftsFromDB() {
  const ongoingShifts = await Shift.find({ endTime: null });
  ongoingShifts.forEach(shift => {
    if (shift.agentId && shift._id) {
      // If shift has a pendingEndUntil, set a timer
      if (shift.pendingEndUntil && new Date(shift.pendingEndUntil) > new Date()) {
        const msLeft = new Date(shift.pendingEndUntil) - new Date();
        shift._pendingEnd = setTimeout(async () => {
          shift.endTime = new Date();
          shift.duration = (shift.endTime - shift.startTime) / 1000;
          await shift.save();
          delete state.agentShifts[shift.agentId];
        }, msLeft);
      }
      state.agentShifts[shift.agentId] = shift._id;
    }
  });
  console.log('Agent shifts synced from DB.');
}
// --- AGENT SHIFT TRACKING ---

const Shift = require('../models/shiftModel');
const Agent = require('../models/agent');

// Use extension number for shift monitoring
async function startAgentShiftByExtension(extensionNumber) {
  try {
    // Always check DB for any ongoing shift (no endTime)
    // If a shift is already active in memory, resume
    if (state.agentShifts[extensionNumber]) {
      // Resume logic: check for pending end in DB
      const agent = await Agent.findOne({ username: extensionNumber });
      if (!agent) throw new Error(`Agent not found for username: ${extensionNumber}`);
      let ongoingShift = await Shift.findOne({ agentId: agent._id, endTime: null });
      if (ongoingShift && ongoingShift.pendingEndUntil && new Date(ongoingShift.pendingEndUntil) > new Date()) {
        // Cancel pending end
        ongoingShift.pendingEndUntil = null;
        await ongoingShift.save();
        if (ongoingShift._pendingEnd) {
          clearTimeout(ongoingShift._pendingEnd);
          delete ongoingShift._pendingEnd;
        }
        console.log(`Agent ${extensionNumber} returned within 5 min, shift resumed.`);
      }
      return;
    }
    // Find agent by username (which is the extension number)
    const agent = await Agent.findOne({ username: extensionNumber });
    if (!agent) throw new Error(`Agent not found for username: ${extensionNumber}`);
    // Check for any ongoing shift in DB (no endTime)
    let ongoingShift = await Shift.findOne({ agentId: agent._id, endTime: null });
    if (ongoingShift) {
      // Resume the ongoing shift
      state.agentShifts[extensionNumber] = ongoingShift._id;
      if (ongoingShift.pendingEndUntil && new Date(ongoingShift.pendingEndUntil) > new Date()) {
        // Cancel pending end
        ongoingShift.pendingEndUntil = null;
        await ongoingShift.save();
        if (ongoingShift._pendingEnd) {
          clearTimeout(ongoingShift._pendingEnd);
          delete ongoingShift._pendingEnd;
        }
        console.log(`Agent ${extensionNumber} returned within 5 min, shift resumed.`);
      } else {
        console.log(`Resumed ongoing shift for agent username ${extensionNumber}: ${ongoingShift._id}`);
      }
      return;
    }
    // Otherwise, start a new shift
    const shift = new Shift({ agentId: agent._id, startTime: new Date() });
    const createdShift = await shift.save();
    state.agentShifts[extensionNumber] = createdShift._id;
    console.log(`Shift started for agent username ${extensionNumber}: ${createdShift._id}`);
  } catch (err) {
    console.error('Error starting agent shift:', err.message);
  }
}

// End agent shift and record reason
async function endAgentShiftByExtension(extensionNumber, reason = "unknown") {
  try {
    const shiftId = state.agentShifts[extensionNumber];
    if (shiftId) {
      const shift = await Shift.findById(shiftId);
      if (shift && !shift.endTime) {
        // Instead of ending immediately, set a timer for 5 min
        const pendingEndUntil = new Date(Date.now() + 5 * 60 * 1000);
        shift.pendingEndUntil = pendingEndUntil;
        await shift.save();
        shift._pendingEnd = setTimeout(async () => {
          shift.endTime = new Date();
          shift.duration = (shift.endTime - shift.startTime) / 1000;
          shift.reason = reason;
          shift.pendingEndUntil = null;
          await shift.save();
          console.log(`Shift ended for agent extension ${extensionNumber}: ${shiftId}, reason: ${reason}`);
          delete state.agentShifts[extensionNumber];
        }, 5 * 60 * 1000); // 5 minutes
        console.log(`Shift for agent extension ${extensionNumber} will end in 5 min unless agent returns.`);
      } else {
        delete state.agentShifts[extensionNumber];
      }
    }
  } catch (err) {
    console.error('Error ending agent shift:', err.message);
  }
}

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
  console.log("Emitting queue callers status...");
  console.log("Current queue callers:", state.queueCallers);
  const flattened = state.queueCallers.map(caller => {
    const queueName = queueNameMap[caller.queue] || caller.queue;
    return {
      ...caller,
      queue: queueName,
      waitTime: Math.floor((Date.now() - caller.waitStart) / 1000),
    };
  });
  console.log("Emitting queue callers status:", flattened);
  io.emit("queueStatus", flattened);
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

  // updateCallLog(
  //   Linkedid,
  //   {
  //     linkedId: Linkedid,
  //     callerId: CallerIDNum,
  //     callerName: CallerIDName,
  //     callee: DestExten,
  //     startTime: new Date(),
  //     status: "ringing",
  //     channels: [DestChannel],
  //     direction: DialString && DialString.startsWith("PJSIP/") ? "outbound" : "inbound",
  //   },
  //   { upsert: true } // Create the document if it doesn't exist
  // );
}

const handleQueueStatus = (event) => {
  // console.log("QueueStatus Event:", event);
}

/**
 * 🆕 REVISED: Handles the 'BridgeEnter' event to detect a two-party conversation and start recording.
 * This version uses the Linkedid to ensure only one recording is started per call, and the PJSIP
 * channel to ensure it's the correct bridge.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 * @param {object} ami - The AMI client instance.
 */
// Add to state
state.recordingByLinkedId = {};

function handleBridgeEnter(event, io, ami) {
    const { BridgeUniqueid, Linkedid, Channel, CallerIDNum, CallerIDName, ConnectedLineNum, ConnectedLineName } = event;

    // 🆕 NEW: Ensure Linkedid is valid before proceeding
    if (!Linkedid) {
        console.error("Received BridgeEnter event with no Linkedid.");
        return;
    }
    
    if (!state.activeBridges[BridgeUniqueid]) {
        state.activeBridges[BridgeUniqueid] = {
            channels: new Set(),
            linkedId: Linkedid,
            callerId: CallerIDNum,
            callerName: CallerIDName,
            connectedLineNum: ConnectedLineNum,
            connectedLineName: ConnectedLineName,
        };
    }

    state.activeBridges[BridgeUniqueid].channels.add(Channel);

    const bridgeData = state.activeBridges[BridgeUniqueid];
    const channels = [...bridgeData.channels];

    // 🆕 REFINED CHECK: Use Object.prototype.hasOwnProperty to safely check if a recording has started
    if (channels.length === 2 && !Object.prototype.hasOwnProperty.call(state.recordingByLinkedId, Linkedid)) {
        console.log("Starting recording for Linkedid:", Linkedid, "on bridge:", BridgeUniqueid, "with channels:", channels);
            // Immediately mark this call as being recorded to prevent a race condition
            state.recordingByLinkedId[Linkedid] = true;

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const fileName = `call-log-${Linkedid}-${timestamp}.wav`;
            const filePath = path.join(recordingsBasePath, fileName);
            
            console.log(`✅ Caller-Agent conversation detected on bridge ${BridgeUniqueid} for Linkedid ${Linkedid}. Starting MixMonitor.`);
      
            ami.action({
                Action: "MixMonitor",
                Channel: channels.find(c => c.startsWith('PJSIP/')),
                File: filePath,
                Options: "b",
            }, (err) => {
                if (err) {
                    console.error("❌ Failed to start recording:", err);
                    // Reset the flag if the AMI action fails
                    delete state.recordingByLinkedId[Linkedid];
                } else {
                    console.log(`✅ MixMonitor AMI command sent successfully for ${filePath}`);
                }
            });
            
            // It's also a good idea to update the call log here, once you've decided to record
            updateCallLog(Linkedid, {
                answerTime: new Date(),
                status: "answered",
                callee: bridgeData.connectedLineNum,
                calleeName: bridgeData.connectedLineName,
                recordingPath: filePath,
            });
    }

    // Your original logic for the frontend
    state.ongoingCalls[Linkedid] = {
        caller: CallerIDNum,
        callerName: CallerIDName,
        agent: ConnectedLineNum,
        agentName: ConnectedLineName,
        state: "Talking",
        startTime: Date.now(),
        channels: Array.from(state.activeBridges[BridgeUniqueid].channels),
    };

    io.emit("ongoingCalls", Object.values(state.ongoingCalls));
} 

// --- Bridge Destroy Handler ---
// 🆕 NEW: This function cleans up the state when a bridge is destroyed.
function handleBridgeDestroy(event) {
  const { BridgeUniqueid } = event;
  if (state.activeBridges[BridgeUniqueid]) {
    delete state.activeBridges[BridgeUniqueid];
    console.log(`Bridge ${BridgeUniqueid} destroyed. State cleaned up.`);
  }
}

/**
 * Handles the 'Hangup' event, consolidating all end-of-call logic.
 * This is the single source of truth for terminated calls.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 */
function handleHangup(event, io) {
  console.log("Hangup Event:", event);
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
    // updateCallLog(event.Linkedid, { status: "on_hold" });
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
  // console.log("Queue Mapping:", queueNameMap);
  // console.log("Queue Caller Join Event:", event);
  const { Queue, Uniqueid, CallerIDNum, Position } = event;

  const alreadyExists = state.queueCallers.some(c => c.id === Uniqueid);
  if (!alreadyExists) {
    state.queueCallers.push({
      id: Uniqueid,
      caller_id: CallerIDNum,
      position: parseInt(Position),
      queue: queueNameMap[Queue] || Queue,  // Map number to name here
      waitStart: Date.now(),
    });
  }
  console.log(`📞 Caller ${CallerIDNum} joined queue ${Queue} at position ${Position}`);
  // console.log(state.queueCallers);
  emitQueueCallersStatus(io);
}



function handleQueueCallerLeave(event, io) {
  const { Uniqueid } = event;
  // Filter out caller by ID from the array (ignore queue)
  state.queueCallers = state.queueCallers.filter(c => c.id !== Uniqueid);
  emitQueueCallersStatus(io);
}


// --- ENDPOINT & AGENT STATUS HANDLERS ---

function handleEndpointList(event) {
  // console.log(event)
  state.endpointList.push(event);
}

function handleEndpointListComplete(event,io) {

  // io.emit("endpointList", state.endpointList);
  state.endpointList = []; // Reset for the next batch
}

// Enhanced: Track agent shift on status change
async function handleContactStatus(event, io) {
  const { EndpointName, ContactStatus } = event;
  let status = "";
  let reason = "unknown";
  if (ContactStatus === "Reachable") {
    status = "online";
    reason = "manual login";
  } else if (ContactStatus === "Unreachable") {
    status = "offline";
    reason = "connection lost";
  } else if (ContactStatus === "Removed") {
    status = "offline";
    reason = "power outage or removed";
  }

  if (status) {
    io.emit("agentStatusUpdate", { agentId: EndpointName, status });
    // Start/end shift based on status using extension number
    if (status === "online") {
      await startAgentShiftByExtension(EndpointName);
    } else if (status === "offline") {
      await endAgentShiftByExtension(EndpointName, reason);
    }
  }
}

const handleBridgeCreate = (event) => {
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
  ami.on("BridgeCreate", (event) => {handleBridgeCreate(event, io, ami)})
  ami.on("BridgeEnter", (event) => handleBridgeEnter(event, io, ami));
  ami.on("BridgeDestroy", handleBridgeDestroy);

  ami.on("DialBegin", (event) => handleDialBegin(event, io));
  ami.on("Hangup", (event) => handleHangup(event, io));
  ami.on("Hold", (event) => handleHold(event, io));
  ami.on("Unhold", (event) => handleUnhold(event, io));

  ami.on("MixMonitorStart", (event) => {
    console.log("MixMonitorStart Event:", event);
    // Handle MixMonitorStart if needed
  });
  ami.on("MixMonitorStop", (event) => {
    console.log("MixMonitorStop Event:", event)
  })

  // Handle MixMonitorStop if needed

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
  ami.on("EndpointListComplete", (event) => handleEndpointListComplete(event, io));
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

module.exports = { setupAmiEventListeners, state, loadQueueNamesMap };