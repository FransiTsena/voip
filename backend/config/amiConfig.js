// /ami/handler.js (Example file path)
const CallLog = require("../models/callLog.js");
const Queue = require("../models/queue.js");
const fs = require("fs");
const path = require("path");
const Shift = require("../models/shiftModel");
const Agent = require("../models/agent");

const recordingsBasePath =
  process.env.RECORDINGS_BASE_PATH ||
  "/var/spool/asterisk/monitor/insaRecordings";

if (!fs.existsSync(recordingsBasePath)) {
  fs.mkdirSync(recordingsBasePath, { recursive: true });
}
let queueNameMap = {};
async function loadQueueNamesMap() {
  const queues = await Queue.find({}, { queueId: 1, name: 1 }).lean();
  const map = {};
  queues.forEach((q) => {
    map[q.queueId] = q.name;
  });
  queueNameMap = map;
}

// Agent mapping similar to queue mapping - using Extension model for frontend compatibility
let agentDataMap = {};
async function loadAgentDataMap() {
  const Extension = require("../models/extension");
  const extensions = await Extension.find(
    {},
    { userExtension: 1, displayName: 1, _id: 1 }
  ).lean();
  const map = {};
  extensions.forEach((ext) => {
    // Parse displayName to get first and last name (assuming format "First Last")
    const nameParts = ext.displayName
      ? ext.displayName.split(" ")
      : ["Agent", ext.userExtension];
    const firstName = nameParts[0] || "Agent";
    const lastName = nameParts.slice(1).join(" ") || ext.userExtension;

    map[ext.userExtension] = {
      // Use userExtension as key
      id: ext._id,
      extension: ext.userExtension,
      first_name: firstName,
      last_name: lastName,
      full_name: ext.displayName || `Agent ${ext.userExtension}`,
      displayName: ext.displayName,
    };
  });
  agentDataMap = map;
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
  agentStatus: {}, // Track real-time agent status
};

// On startup, load all ongoing shifts and pending ends into memory
async function syncAgentShiftsFromDB() {
  const ongoingShifts = await Shift.find({ endTime: null });
  ongoingShifts.forEach((shift) => {
    if (shift.agentId && shift._id) {
      // If shift has a pendingEndUntil, set a timer
      if (
        shift.pendingEndUntil &&
        new Date(shift.pendingEndUntil) > new Date()
      ) {
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
  // console.log("Agent shifts synced from DB.");
}
// --- AGENT SHIFT TRACKING ---

// Use extension number for shift monitoring
async function startAgentShiftByExtension(extensionNumber) {
  try {
    // Always check DB for any ongoing shift (no endTime)
    // If a shift is already active in memory, resume
    if (state.agentShifts[extensionNumber]) {
      // Resume logic: check for pending end in DB
      const agent = await Agent.findOne({ username: extensionNumber });
      if (!agent)
        throw new Error(`Agent not found for username: ${extensionNumber}`);
      let ongoingShift = await Shift.findOne({
        agentId: agent._id,
        endTime: null,
      });
      if (
        ongoingShift &&
        ongoingShift.pendingEndUntil &&
        new Date(ongoingShift.pendingEndUntil) > new Date()
      ) {
        // Cancel pending end
        ongoingShift.pendingEndUntil = null;
        await ongoingShift.save();
        if (ongoingShift._pendingEnd) {
          clearTimeout(ongoingShift._pendingEnd);
          delete ongoingShift._pendingEnd;
        }
      }
      return;
    }
    // Find agent by username (which is the extension number)
    const agent = await Agent.findOne({ username: extensionNumber });
    if (!agent)
      throw new Error(`Agent not found for username: ${extensionNumber}`);
    // Check for any ongoing shift in DB (no endTime)
    let ongoingShift = await Shift.findOne({
      agentId: agent._id,
      endTime: null,
    });
    if (ongoingShift) {
      // Resume the ongoing shift
      state.agentShifts[extensionNumber] = ongoingShift._id;
      if (
        ongoingShift.pendingEndUntil &&
        new Date(ongoingShift.pendingEndUntil) > new Date()
      ) {
        // Cancel pending end
        ongoingShift.pendingEndUntil = null;
        await ongoingShift.save();
        if (ongoingShift._pendingEnd) {
          clearTimeout(ongoingShift._pendingEnd);
          delete ongoingShift._pendingEnd;
        }
      } else {
        console.log(
          `Resumed ongoing shift for agent username ${extensionNumber}: ${ongoingShift._id}`
        );
      }
      return;
    }
    // Otherwise, start a new shift
    const shift = new Shift({ agentId: agent._id, startTime: new Date() });
    const createdShift = await shift.save();
    state.agentShifts[extensionNumber] = createdShift._id;
  } catch (err) {
    console.error("Error starting agent shift:", err.message);
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

          delete state.agentShifts[extensionNumber];
        }, 5 * 60 * 1000); // 5 minutes
        console.log(
          `Shift for agent extension ${extensionNumber} will end in 5 min unless agent returns.`
        );
      } else {
        delete state.agentShifts[extensionNumber];
      }
    }
  } catch (err) {
    console.error("Error ending agent shift:", err.message);
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
    await CallLog.findOneAndUpdate({ linkedId }, updateData, {
      ...options,
      new: true,
    });
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
  const flattened = state.queueCallers.map((caller) => {
    return {
      ...caller,
      // caller.queue already contains the queue name from handleQueueCallerJoin
      waitTime: Math.floor((Date.now() - caller.waitStart) / 1000),
    };
  });

  console.log(`📊 Emitting ${flattened.length} queue callers to all clients`);
  io.emit("queueStatus", flattened);
}

/**
 * Emits the current queue members to all clients.
 * Flattens the queue members data structure for frontend consumption.
 * @param {object} io - The Socket.IO server instance.
 */
function emitQueueMembersStatus(io) {
  const flattenedMembers = [];
  Object.keys(state.queueMembers).forEach((queueId) => {
    state.queueMembers[queueId].forEach((member) => {
      flattenedMembers.push({
        ...member,
        queueName: queueNameMap[queueId] || queueId,
      });
    });
  });

  console.log(
    `📊 Emitting ${flattenedMembers.length} queue members to all clients`
  );
  io.emit("queueMembers", flattenedMembers);
}

/**
 * Emits the current ongoing calls to all clients.
 * @param {object} io - The Socket.IO server instance.
 */
function emitOngoingCallsStatus(io) {
  const ongoingCallsArray = Object.values(state.ongoingCalls);
  console.log(
    `📞 Emitting ${ongoingCallsArray.length} ongoing calls to all clients`
  );
  io.emit("ongoingCalls", ongoingCallsArray);
}

/**
 * Emits ALL agents from database with their real-time status and stats mapped.
 * This ensures frontend gets complete agent list (online + offline) with stats.
 * @param {object} ioOrSocket - The Socket.IO server instance or individual socket.
 */
// Agent status emission is now handled by realTimeAgent.js
// This function is kept for compatibility but delegates to realTimeAgent
function emitAgentStatus(ioOrSocket) {
  // Delegate to realTimeAgent system
  const {
    emitAgentStatus: realTimeEmitAgentStatus,
  } = require("../controllers/agentControllers/realTimeAgent");
  realTimeEmitAgentStatus(ioOrSocket);
}

// --- CALL LIFECYCLE EVENT HANDLERS ---

/**
 * Handles the 'DialBegin' event when a call starts ringing.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 */
function handleDialBegin(event, io) {
  const {
    Linkedid,
    CallerIDNum,
    CallerIDName,
    DestExten,
    DialString,
    DestChannel,
  } = event;

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

  // Ensure a CallLog exists as soon as the call starts ringing
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
      direction:
        DialString && DialString.startsWith("PJSIP/") ? "outbound" : "inbound",
    },
    { upsert: true, setDefaultsOnInsert: true } // Create the document if it doesn't exist
  );
}

const handleQueueStatus = (event) => {
  // console.log("QueueStatus Event:", event);
};

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
  const {
    BridgeUniqueid,
    Linkedid,
    Channel,
    CallerIDNum,
    CallerIDName,
    ConnectedLineNum,
    ConnectedLineName,
  } = event;

  // 🆕 NEW: Ensure Linkedid is valid before proceeding
  if (!Linkedid) {
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
  if (
    channels.length === 2 &&
    !Object.prototype.hasOwnProperty.call(state.recordingByLinkedId, Linkedid)
  ) {
    console.log(
      "Starting recording for Linkedid:",
      Linkedid,
      "on bridge:",
      BridgeUniqueid,
      "with channels:",
      channels
    );
    // Immediately mark this call as being recorded to prevent a race condition
    state.recordingByLinkedId[Linkedid] = true;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `call-log-${Linkedid}-${timestamp}.wav`;
    const filePath = path.join(recordingsBasePath, fileName);

    console.log(
      `✅ Caller-Agent conversation detected on bridge ${BridgeUniqueid} for Linkedid ${Linkedid}. Starting MixMonitor.`
    );

    ami.action(
      {
        Action: "MixMonitor",
        Channel: channels.find((c) => c.startsWith("PJSIP/")),
        File: filePath,
        Options: "b",
      },
      (err) => {
        if (err) {
          console.error("❌ Failed to start recording:", err);
          // Reset the flag if the AMI action fails
          delete state.recordingByLinkedId[Linkedid];
        } else {
          console.log(
            `✅ MixMonitor AMI command sent successfully for ${filePath}`
          );
        }
      }
    );
    // It's also a good idea to update the call log here, once you've decided to record
    updateCallLog(
      Linkedid,
      {
        answerTime: new Date(),
        status: "answered",
        callee: bridgeData.connectedLineNum,
        calleeName: bridgeData.connectedLineName,
        agentExtension: bridgeData.connectedLineNum,
        agentName: bridgeData.connectedLineName,
        recordingPath: filePath,
      },
      { upsert: true }
    );
  }
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
  const { Linkedid, Channel, Cause, CauseTxt } = event;

  // Case 1: Call was hung up while ringing -> Missed Call
  if (state.activeRinging[Linkedid]?.ringingChannels.has(Channel)) {
    state.activeRinging[Linkedid].ringingChannels.delete(Channel);

    if (state.activeRinging[Linkedid].ringingChannels.size === 0) {
      console.log(`💔 Missed call ${Linkedid}`);
      io.emit("callState", {
        event: "missed",
        linkedId: Linkedid,
        data: state.activeRinging[Linkedid].callInfo,
      });
      updateCallLog(Linkedid, {
        endTime: new Date(),
        status: "missed",
        hangupCause: Cause,
        hangupCauseTxt: CauseTxt,
      });
      delete state.activeRinging[Linkedid];
    }
    return;
  }

  // Case 2: An answered call was hung up -> Ended, Busy, Failed etc.
  if (state.ongoingCalls[Linkedid]) {
    // Remove the hung up channel from the call's channel list
    state.ongoingCalls[Linkedid].channels = state.ongoingCalls[
      Linkedid
    ].channels.filter((c) => c !== Channel);

    // If no channels remain, the call is completely ended
    if (state.ongoingCalls[Linkedid].channels.length === 0) {
      const call = state.ongoingCalls[Linkedid];
      const duration = Math.floor((Date.now() - call.startTime) / 1000);

      let finalStatus = "ended";
      switch (String(Cause)) {
        case "17":
          finalStatus = "busy";
          break;
        case "18":
        case "19":
          finalStatus = "unanswered";
          break;
        case "21":
          finalStatus = "failed";
          break;
      }

      console.log(`👋 Call ${Linkedid} ended. Duration: ${duration}s`);

      // Emit call ended event with call details
      io.emit("callEnded", {
        ...call,
        linkedId: Linkedid,
        endTime: Date.now(),
        duration,
        finalStatus,
      });

      // Update call log in database
      updateCallLog(Linkedid, {
        endTime: new Date(),
        duration,
        status: finalStatus,
        hangupCause: Cause,
        hangupCauseTxt: CauseTxt,
      });

      // Remove call from ongoing calls state
      delete state.ongoingCalls[Linkedid];

      // Emit updated ongoing calls list to all clients
      emitOngoingCallsStatus(io);
    }
  } else {
    // Force remove any call that might match this LinkedId (fallback cleanup)
    let foundAndRemoved = false;
    Object.keys(state.ongoingCalls).forEach((callId) => {
      if (
        callId === Linkedid ||
        state.ongoingCalls[callId].channels?.includes(Channel)
      ) {
        delete state.ongoingCalls[callId];
        foundAndRemoved = true;
      }
    });

    if (foundAndRemoved) {
      emitOngoingCallsStatus(io);
    }
  }
}

function handleHold(event, io) {
  if (state.ongoingCalls[event.Linkedid]) {
    state.ongoingCalls[event.Linkedid].state = "On Hold";
    console.log(`📞 Call ${event.Linkedid} put on hold`);
    // updateCallLog(event.Linkedid, { status: "on_hold" });
    emitOngoingCallsStatus(io);
  }
}

function handleUnhold(event, io) {
  if (state.ongoingCalls[event.Linkedid]) {
    state.ongoingCalls[event.Linkedid].state = "Talking";
    console.log(`📞 Call ${event.Linkedid} resumed from hold`);
    updateCallLog(event.Linkedid, { status: "answered" });
    emitOngoingCallsStatus(io);
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

  const existingIndex = state.queueMembers[Queue].findIndex(
    (m) => m.Location === Location
  );

  if (existingIndex !== -1) {
    state.queueMembers[Queue][existingIndex] = event;
  } else {
    state.queueMembers[Queue].push(event);
  }
}

function handleQueueStatusComplete(io) {
  io.emit("queueUpdate", state.queueData);
  emitQueueMembersStatus(io);
}

function handleQueueCallerJoin(event, io) {
  console.log(event);
  console.log(event);
  console.log(event);
  // console.log("Queue Mapping:", queueNameMap);
  // console.log("Queue Caller Join Event:", event);
  const { Queue, Uniqueid, CallerIDNum, Position, Linkedid } = event;

  const alreadyExists = state.queueCallers.some((c) => c.id === Uniqueid);
  if (!alreadyExists) {
    state.queueCallers.push({
      id: Uniqueid,
      caller_id: CallerIDNum,
      position: parseInt(Position),
      queue: queueNameMap[Queue] || Queue, // Map number to name here
      queueId: Queue,
      waitStart: Date.now(),
      linkedId: Linkedid,
    });
  }

  // Update call log with queue information
  if (Linkedid) {
    updateCallLog(Linkedid, {
      queue: Queue,
      queueName: queueNameMap[Queue] || Queue,
      status: "queued",
    });
  }

  console.log(
    `📞 Caller ${CallerIDNum} joined queue ${Queue} at position ${Position}`
  );
  // console.log(state.queueCallers);
  emitQueueCallersStatus(io);
}

function handleQueueCallerLeave(event, io) {
  const { Uniqueid, Linkedid } = event;

  // Find the caller to get wait time before removing
  const caller = state.queueCallers.find((c) => c.id === Uniqueid);
  if (caller) {
    const waitTime = Math.floor((Date.now() - caller.waitStart) / 1000);

    // Update call log with wait time
    if (Linkedid || caller.linkedId) {
      updateCallLog(Linkedid || caller.linkedId, {
        waitTime: waitTime,
        status: "answered", // Assuming leave means answered, abandon event handles abandonment
      });
    }

    console.log(
      `📞 Caller ${caller.caller_id} left queue ${caller.queueId} after waiting ${waitTime}s`
    );
  }

  // Filter out caller by ID from the array (ignore queue)
  state.queueCallers = state.queueCallers.filter((c) => c.id !== Uniqueid);
  emitQueueCallersStatus(io);
}

function handleQueueCallerAbandon(event, io) {
  const { Uniqueid, Linkedid, Queue } = event;

  // Find the caller to get wait time before removing
  const caller = state.queueCallers.find((c) => c.id === Uniqueid);
  if (caller) {
    const waitTime = Math.floor((Date.now() - caller.waitStart) / 1000);

    // Update call log with abandon status and wait time
    if (Linkedid || caller.linkedId) {
      updateCallLog(Linkedid || caller.linkedId, {
        waitTime: waitTime,
        status: "abandoned",
        endTime: new Date(),
      });
    }

    console.log(
      `📞 Caller ${caller.caller_id} abandoned queue ${caller.queueId} after waiting ${waitTime}s`
    );
  }

  // Filter out caller by ID from the array
  state.queueCallers = state.queueCallers.filter((c) => c.id !== Uniqueid);
  emitQueueCallersStatus(io);
}

/**
 * Handles the 'AgentComplete' event when a queue call ends.
 * Uses DestLinkedid to remove the ongoing call and emit updated list.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 */
function handleAgentComplete(event, io) {
  const {
    DestLinkedid,
    Queue,
    MemberName,
    HoldTime,
    TalkTime,
    Reason,
    CallerIDNum,
    CallerIDName,
  } = event;

  console.log(
    `🎯 AgentComplete: Queue call ended for ${CallerIDNum} in queue ${Queue}`
  );

  // Remove the ongoing call using DestLinkedid
  if (state.ongoingCalls[DestLinkedid]) {
    const call = state.ongoingCalls[DestLinkedid];
    const totalDuration = parseInt(HoldTime) + parseInt(TalkTime);

    console.log(
      `👋 Queue call ${DestLinkedid} completed. Hold: ${HoldTime}s, Talk: ${TalkTime}s, Total: ${totalDuration}s`
    );

    // Update call log with queue completion data
    updateCallLog(DestLinkedid, {
      endTime: new Date(),
      duration: totalDuration,
      status: "completed",
      holdTime: parseInt(HoldTime),
      waitTime: parseInt(HoldTime), // Hold time is essentially wait time in queue
      queue: Queue,
      agentName: MemberName,
      hangupReason: Reason,
    });

    // Remove call from ongoing calls state
    delete state.ongoingCalls[DestLinkedid];

    // Emit call ended event with queue-specific details
    io.emit("callEnded", {
      ...call,
      linkedId: DestLinkedid,
      endTime: Date.now(),
      duration: totalDuration,
      holdTime: parseInt(HoldTime),
      talkTime: parseInt(TalkTime),
      queue: Queue,
      agent: MemberName,
      reason: Reason,
      finalStatus: "completed",
    });

    // Emit updated ongoing calls list to all clients
    emitOngoingCallsStatus(io);
  } else {
    console.log(
      `⚠️ AgentComplete event for ${DestLinkedid} but call not found in ongoing calls`
    );
  }
}

// --- ENDPOINT & AGENT STATUS HANDLERS ---

function handleEndpointList(event) {
  // console.log(event)
  // Track agent status in real-time
  const agentId = event.ObjectName;
  const status = event.State === "Online" ? "online" : "offline";

  state.agentStatus[agentId] = {
    extension: agentId,
    aor: event.AOR,
    state: event.State,
    contacts: event.Contacts,
    transport: event.Transport,
    deviceState: event.DeviceState,
    status: status,
    lastUpdated: new Date(),
  };

  state.endpointList.push(event);
}

function handleEndpointListComplete(event, io) {
  // Emit the enriched agent status to all connected clients
  emitAgentStatus(io);

  // Reset for the next batch
  state.endpointList = [];
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
    // Update agent status in state
    if (state.agentStatus[EndpointName]) {
      state.agentStatus[EndpointName].status = status;
      state.agentStatus[EndpointName].lastUpdated = new Date();
    } else {
      state.agentStatus[EndpointName] = {
        extension: EndpointName,
        status: status,
        lastUpdated: new Date(),
      };
    }

    // Emit real-time status update to all clients
    io.emit("agentStatusUpdate", {
      agentId: EndpointName,
      status: status,
      timestamp: new Date(),
    });

    // Emit the enriched agent status
    emitAgentStatus(io);

    // Start/end shift based on status using extension number
    if (status === "online") {
      await startAgentShiftByExtension(EndpointName);
    } else if (status === "offline") {
      await endAgentShiftByExtension(EndpointName, reason);
    }
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
  await loadAgentDataMap();

  // Make queue name map globally accessible
  global.queueNameMap = queueNameMap;
  global.state = state;

  // Initialize real-time agent tracking with stats
  const {
    setupAgentListeners,
  } = require("../controllers/agentControllers/realTimeAgent");
  setupAgentListeners(ami, io);

  // Initialize real-time queue statistics tracking
  const {
    setupQueueStatsListeners,
  } = require("../controllers/queueControllers/realTimeQueueStats");
  setupQueueStatsListeners(ami, io);

  ami.on("BridgeEnter", (event) => handleBridgeEnter(event, io, ami));
  ami.on("BridgeDestroy", handleBridgeDestroy);

  ami.on("AgentComplete", (event) => handleAgentComplete(event, io));
  ami.on("DialBegin", (event) => handleDialBegin(event, io));
  ami.on("Hangup", (event) => handleHangup(event, io));
  ami.on("Hold", (event) => handleHold(event, io));
  ami.on("Unhold", (event) => handleUnhold(event, io));

  ami.on("QueueParams", handleQueueParams);
  ami.on("QueueMember", handleQueueMember);
  ami.on("QueueStatus", handleQueueStatus);
  ami.on("QueueStatusComplete", () => handleQueueStatusComplete(io));
  ami.on("QueueCallerJoin", (event) => handleQueueCallerJoin(event, io));
  ami.on("QueueCallerLeave", (event) => handleQueueCallerLeave(event, io));
  ami.on("QueueCallerAbandon", (event) => handleQueueCallerAbandon(event, io));

  // Endpoint/Agent Status Events
  ami.on("EndpointList", handleEndpointList);
  ami.on("EndpointListComplete", (event) =>
    handleEndpointListComplete(event, io)
  );
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

module.exports = {
  setupAmiEventListeners,
  state,
  loadQueueNamesMap,
  loadAgentDataMap,
  emitAgentStatus,
  emitOngoingCallsStatus,
};
