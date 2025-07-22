const AmiClient = require("asterisk-ami-client");
const { initializeExtension, extensions } = require("../utils/helper.js");
const { updateAgentStatus } = require("../utils/agentStatus.js");
const CallLog = require("../models/callLog.js");
const ami = new AmiClient();

// Track AMI connection state
global.amiReady = false;

// Remove immediate connection here. Connection will be handled in index.js

const queueData = {};
const queueMembers = {};
const queueCallers = {};
const ongoingCalls = {};
const activeRinging = {};
async function setupAmi(io, socket) {
  function emitQueueData() {
    const data = Object.entries(queueCallers).reduce(
      (acc, [queue, callers]) => {
        acc[queue] = callers.map((c) => ({
          ...c,
          waitTime: Math.floor((Date.now() - c.waitStart) / 1000),
        }));
        return acc;
      },
      {}
    );

    io.emit("queueStatus", data);
  }

  try {
    ami.setMaxListeners(50);
    global.amiReady = true;
    console.log("AMI instance ready for events (setupAmi)");

    setInterval(() => {
      if (global.amiReady) {
        ami.action({ Action: "QueueStatus" });
      }
    }, 2000);

    setInterval(() => {
      if (global.amiReady) {
        ami.action({ Action: "PJSIPShowEndpoints" });
      }
    }, 5000);

    ami.on("DialBegin", async (event) => {
      const linkedId = event.Linkedid;
      const destChannel = event.DestChannel;

      if (!activeRinging[linkedId]) {
        activeRinging[linkedId] = {
          callInfo: {
            callerId: event.CallerIDNum,
            callerName: event.CallerIDName,
            destination: event.DestExten,
            dialString: event.DialString,
          },
          ringingChannels: new Set(),
        };
      }

      activeRinging[linkedId].ringingChannels.add(destChannel);
      console.log(`Ringing started on ${destChannel} for call ${linkedId}`);

      // Create or update call log for ringing
      try {
        await CallLog.findOneAndUpdate(
          { linkedId },
          {
            linkedId,
            callerId: event.CallerIDNum,
            callerName: event.CallerIDName,
            callee: event.DestExten,
            dialString: event.DialString,
            startTime: new Date(),
            status: "ringing",
            channels: [destChannel],
            direction:
              event.Dialstring && event.Dialstring.startsWith("PJSIP/")
                ? "outbound"
                : "inbound",
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error("Error logging call (DialBegin):", err);
      }
    });
    ami.on("Hangup", async (event) => {
      const linkedId = event.Linkedid;
      const channel = event.Channel;

      // Case 1: Hung up while ringing
      if (
        activeRinging[linkedId] &&
        activeRinging[linkedId].ringingChannels.has(channel)
      ) {
        activeRinging[linkedId].ringingChannels.delete(channel);
        console.log(`Ringing channel ${channel} hung up for call ${linkedId}`);

        io.emit("callState", {
          event: "ringing_stop",
          linkedId: linkedId,
          channel: channel,
        });

        // If all ringing channels hung up
        if (activeRinging[linkedId].ringingChannels.size === 0) {
          io.emit("callState", {
            event: "missed",
            linkedId: linkedId,
            data: activeRinging[linkedId].callInfo,
          });
          // Update call log as missed
          try {
            await CallLog.findOneAndUpdate(
              { linkedId },
              {
                endTime: new Date(),
                status: "missed",
                hangupCause: event.Cause ? event.Cause : undefined,
              },
              { new: true }
            );
          } catch (err) {
            console.error("Error logging call (Hangup-missed):", err);
          }
          delete activeRinging[linkedId];
        }
        return;
      }

      // Case 2: Hung up during active call
      if (ongoingCalls[linkedId]) {
        // Remove the hung up channel from tracking
        ongoingCalls[linkedId].channels = ongoingCalls[
          linkedId
        ].channels.filter((c) => c !== channel);

        // If all channels are gone, call is ended
        if (ongoingCalls[linkedId].channels.length === 0) {
          io.emit("callEnded", {
            ...ongoingCalls[linkedId],
            endTime: Date.now(),
            duration: Date.now() - ongoingCalls[linkedId].startTime,
          });
          // Update call log as ended
          try {
            await CallLog.findOneAndUpdate(
              { linkedId },
              {
                endTime: new Date(),
                duration: ongoingCalls[linkedId].startTime
                  ? Math.floor((Date.now() - ongoingCalls[linkedId].startTime) / 1000)
                  : undefined,
                status: "ended",
                hangupCause: event.Cause ? event.Cause : undefined,
              },
              { new: true }
            );
          } catch (err) {
            console.error("Error logging call (Hangup-ended):", err);
          }
          delete ongoingCalls[linkedId];
          io.emit("ongoingCalls", Object.values(ongoingCalls));
        }
      }
    });
    // Handle successful call answers
    ami.on("BridgeEnter", async (event) => {
      const linkedId = event.Linkedid;

      if (activeRinging[linkedId]) {
        // Convert ringing call to active call
        ongoingCalls[linkedId] = {
          caller:
            event.CallerIDNum || activeRinging[linkedId].callInfo.callerId,
          callerName:
            event.CallerIDName || activeRinging[linkedId].callInfo.callerName,
          agent: event.ConnectedLineNum || event.DestExten,
          extension: event.ConnectedLineNum,
          state: "Talking",
          startTime: Date.now(),
          channels: [event.Channel1, event.Channel2].filter(Boolean),
        };

        // Update call log to answered
        try {
          await CallLog.findOneAndUpdate(
            { linkedId },
            {
              answerTime: new Date(),
              status: "answered",
              callee: event.ConnectedLineNum || event.DestExten,
              calleeName: event.ConnectedLineName,
              $addToSet: { channels: { $each: [event.Channel1, event.Channel2].filter(Boolean) } },
            },
            { new: true }
          );
        } catch (err) {
          console.error("Error logging call (BridgeEnter):", err);
        }

        // Clear ringing state
        delete activeRinging[linkedId];

        console.log(
          `Call ${linkedId} answered by ${ongoingCalls[linkedId].agent}`
        );
        console.log(ongoingCalls);
        io.emit("ongoingCalls", Object.values(ongoingCalls));
      }
    });
    ami.on("Hold", (event) => {
      if (ongoingCalls[event.Linkedid]) {
        ongoingCalls[event.Linkedid].state = "On Hold";
        // Update call log status to on_hold
        CallLog.findOneAndUpdate(
          { linkedId: event.Linkedid },
          { status: "on_hold" },
          { new: true }
        ).catch((err) => {
          console.error("Error logging call (Hold):", err);
        });
      }
      io.emit("ongoingCalls", Object.values(ongoingCalls));
    });

    ami.on("Unhold", (event) => {
      if (ongoingCalls[event.Linkedid]) {
        ongoingCalls[event.Linkedid].state = "Talking";
        // Update call log status back to answered
        CallLog.findOneAndUpdate(
          { linkedId: event.Linkedid },
          { status: "answered" },
          { new: true }
        ).catch((err) => {
          console.error("Error logging call (Unhold):", err);
        });
      }
      io.emit("ongoingCalls", Object.values(ongoingCalls));
    });

    ami.on("QueueParams", (event) => {
      queueData[event.Queue] = {
        name: event.Queue,
        calls: parseInt(event.Calls),
        holdtime: parseInt(event.HoldTime),
        completed: parseInt(event.Completed),
        abandoned: parseInt(event.Abandoned),
        strategy: event.Strategy,
      };
    });
    ami.on("QueueStatusComplete", () => {
      io.emit("queueUpdate", Object.values(queueData));
      const allMembers = Object.values(queueMembers).flat();

      io.emit("queueMembers", queueMembers);
    });

    ami.on("QueueMember", (event) => {
      const queue = event.Queue;

      if (!queueMembers[queue]) {
        queueMembers[queue] = [];
      }
      const existingIndex = queueMembers[queue].findIndex(
        (member) => member.Location === event.Location
      );

      if (existingIndex !== -1) {
        queueMembers[queue][existingIndex] = event;
      } else {
        queueMembers[queue].push(event);
      }

      const allMembers = Object.values(queueMembers).flat();
      io.emit("queueMembers", allMembers);
    });


    ami.on("QueueCallerList", (event) => {
      const queue = event.Queue;
      if (!queueCallers[queue]) {
        queueCallers[queue] = [];
      }
      // Clear existing callers for this queue
      queueCallers[queue] = event.Callers.map((caller) => ({
        id: caller.Uniqueid,
        caller_id: caller.CallerIDNum,
        position: parseInt(caller.Position),
        waitStart: Date.now(),
      }));
      emitQueueData();
    });

    ami.on("QueueCallerJoin", (event) => {
      ami.action({ Action: "QueueStatus" });
      const queue = event.Queue;
      const uniqueId = event.Uniqueid;
      const CallerIDNum = event.CallerIDNum;

      if (!queueCallers[queue]) {
        queueCallers[queue] = [];
      }

      // Add the caller if not already present
      const alreadyExists = queueCallers[queue].some((c) => c.id === uniqueId);
      if (!alreadyExists) {
        queueCallers[queue].push({
          id: uniqueId,
          caller_id: CallerIDNum,
          position: parseInt(event.Position),
          waitStart: Date.now(),
        });
      }

      emitQueueData();
    });
    ami.on("QueueCallerLeave", (event) => {
      const queue = event.Queue;
      const uniqueId = event.Uniqueid;

      if (queueCallers[queue]) {
        queueCallers[queue] = queueCallers[queue].filter(
          (c) => c.id !== uniqueId
        );
      }

      emitQueueData();
    });
    ami.on("QueueCallerAbandon", (event) => {
      const queue = event.Queue;
      const uniqueId = event.Uniqueid;

      if (queueCallers[queue]) {
        queueCallers[queue] = queueCallers[queue].filter(
          (c) => c.id !== uniqueId
        );
      }

      emitQueueData();
    });



    // Collect EndpointList events and emit the full list when complete
    let endpointList = [];
    ami.on("EndpointList", (event) => {
      // Each event is a single endpoint, accumulate them
      // console.log("EndpointList event received:", event);
      endpointList.push(event);
    });
    ami.on("EndpointListComplete", () => {
      // Emit the full endpoint list to the client
      // OLD: io.emit("endpointList", endpointList);
      io.emit("endpointList", endpointList); // <-- This matches your frontend now!
      endpointList = [];
    });

    ami.on("PJSIPShowEndpoints", (event) => {
      if (event.Event === "PJSIPShowEndpoint") {
        const endpoint = event.Endpoint;
        const status = event.Status;

        // Update the endpoint status in extensions
        if (extensions[endpoint]) {
          extensions[endpoint].status = status;
          io.emit("extensionStatusUpdate", {
            extension: endpoint,
            status: status,
          });
        } else {
          // Initialize if not already present
          initializeExtension(endpoint, status);
        }
      }
    });

    /***
     *
     * AMI over all event tracking
     *
     */
    ami.on("event", async (event) => {
      // console.log(ongoingCalls);
      const callee = event.Exten;

      // handle missed calls
      if (event.Event == "Hangup" && event.Exten == "NOANSWER") {
        const agent = event.ConnectedLineNum;
        // await updateAgentCallStatus("missed_call", agent);
      }

      // handle ended calls
      if (event.Event == "Hangup" && event.Cause == 16) {
        // Normal Clearing (call ended normally)
        try {
          await CallLog.findOneAndUpdate(
            { linkedId: event.Linkedid },
            { status: "ended", endTime: new Date(), hangupCause: event.Cause },
            { new: true }
          );
        } catch (err) {
          console.error("Error logging call (Hangup-ended):", err);
        }
      }

      // handle busy calls
      if (event.Event == "Hangup" && event.Cause == 17) {
        // User busy
        try {
          await CallLog.findOneAndUpdate(
            { linkedId: event.Linkedid },
            { status: "busy", endTime: new Date(), hangupCause: event.Cause },
            { new: true }
          );
        } catch (err) {
          console.error("Error logging call (Hangup-busy):", err);
        }
      }

      // handle failed calls
      if (event.Event == "Hangup" && event.Cause == 21) {
        // Call rejected
        try {
          await CallLog.findOneAndUpdate(
            { linkedId: event.Linkedid },
            { status: "failed", endTime: new Date(), hangupCause: event.Cause },
            { new: true }
          );
        } catch (err) {
          console.error("Error logging call (Hangup-failed):", err);
        }
      }

      // handle unanswered calls
      if (event.Event == "Hangup" && event.Cause == 18) {
        // No user responding
        try {
          await CallLog.findOneAndUpdate(
            { linkedId: event.Linkedid },
            { status: "unanswered", endTime: new Date(), hangupCause: event.Cause },
            { new: true }
          );
        } catch (err) {
          console.error("Error logging call (Hangup-unanswered):", err);
        }
      }

      if (event.Event === "ContactStatus") {
        const agentId = event.EndpointName;
        let status = "";
        if (event.ContactStatus === "Reachable") {
          status = "online";
        } else if (
          event.ContactStatus === "Removed" ||
          event.ContactStatus === "NonQualified"
        ) {
          status = "offline";
        }

        if (status) {
          // console.log(`Agent ${agentId} is now ${status}`);

          try {
            const agent = await updateAgentStatus(agentId, status);
            io.emit("agent_update", agent);
          } catch (error) {
            console.error(`Error updating agent ${agentId} status:`, error);
          }
        }
      }
    });

    // Register socket event listeners ONCE, not inside AMI event handlers
    socket.on("hangupCall", (callId) => {
      // console.log("Hung Up Id:--------");
      // console.log(callId);

      if (ongoingCalls[callId]) {
        const channels = ongoingCalls[callId].channels;
        channels.forEach((channel) => {
          ami.action({
            Action: "Hangup",
            Channel: channel,
            Cause: "16", // Normal Clearing
          });
        });
        delete ongoingCalls[callId];
        io.emit("ongoingCalls", Object.values(ongoingCalls));
      }
    });
  } catch (err) {
    throw err;
  }
}

module.exports = { ami, setupAmi };
