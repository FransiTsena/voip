// realTimeAgent.js
// Manage real-time agent status and stats from AMI events and emit via Socket.IO

const Agent = require("../../models/agent");
const Extension = require("../../models/extension");

const state = {
  agents: {}, // { username: { stats and live info } }
  callSessions: {}, // Track ongoing calls for timing
  idleTimers: {}, // Track idle time for each agent
};

// Helper to initialize agent record if missing
async function getOrCreateAgent(username) {
  if (!state.agents[username]) {
    // Try to load from database first
    let dbAgent = await Agent.findOne({ username });
    let extensionData = await Extension.findOne({ userExtension: username });

    if (!dbAgent) {
      // Create new agent record in database
      dbAgent = new Agent({
        username,
        name: extensionData ? extensionData.displayName : `Agent ${username}`,
        email: extensionData?.email || null,
        queues: [],
      });
      await dbAgent.save();
    }

    state.agents[username] = {
      id: dbAgent._id,
      username,
      name: dbAgent.name,
      email: dbAgent.email,
      queues: dbAgent.queues || [],
      deviceState: "Offline",

      // Live status snapshot
      liveStatus: "Idle", // Idle, In Use, Paused, Unavailable, Ringing, Busy, etc.
      currentCallStart: null,
      lastActivity: new Date(),

      // Daily stats (from database)
      totalCallsToday: dbAgent.totalCallsToday || 0,
      answeredCallsToday: dbAgent.answeredCallsToday || 0,
      missedCallsToday: dbAgent.missedCallsToday || 0,
      averageTalkTimeToday: dbAgent.averageTalkTimeToday || 0,
      averageWrapTimeToday: dbAgent.averageWrapTimeToday || 0,
      averageHoldTimeToday: dbAgent.averageHoldTimeToday || 0,
      averageRingTimeToday: dbAgent.averageRingTimeToday || 0,
      longestIdleTimeToday: dbAgent.longestIdleTimeToday || 0,

      // Overall stats (from database)
      totalCallsOverall: dbAgent.totalCallsOverall || 0,
      answeredCallsOverall: dbAgent.answeredCallsOverall || 0,
      missedCallsOverall: dbAgent.missedCallsOverall || 0,
      averageTalkTimeOverall: dbAgent.averageTalkTimeOverall || 0,
      averageWrapTimeOverall: dbAgent.averageWrapTimeOverall || 0,
      averageHoldTimeOverall: dbAgent.averageHoldTimeOverall || 0,
      averageRingTimeOverall: dbAgent.averageRingTimeOverall || 0,
      longestIdleTimeOverall: dbAgent.longestIdleTimeOverall || 0,
    };
  }
  return state.agents[username];
}

// Calculate new average given old avg, count and new value
function updateAverage(oldAvg, count, newValue) {
  if (count === 0) return newValue;
  return (oldAvg * (count - 1) + newValue) / count;
}

/**
 * Increment answered calls for an agent and update related metrics
 * @param {string} username - Agent username/extension
 * @param {number} holdTime - Time caller waited in queue (seconds)
 * @param {number} ringTime - Time agent phone rang (seconds)
 * @param {object} io - Socket.IO instance for real-time updates
 */
async function incrementAnsweredCalls(
  username,
  holdTime = 0,
  ringTime = 0,
  io
) {
  try {
    console.log(`📞 Incrementing answered calls for agent ${username}`);

    const agent = await getOrCreateAgent(username);

    // Increment call counts
    agent.totalCallsToday += 1;
    agent.totalCallsOverall += 1;
    agent.answeredCallsToday += 1;
    agent.answeredCallsOverall += 1;

    console.log(
      `📊 Agent ${username} stats - Today: ${agent.answeredCallsToday}, Overall: ${agent.answeredCallsOverall}`
    );

    // Update timing metrics
    const holdTimeSeconds = parseInt(holdTime) || 0;
    const ringTimeSeconds = parseInt(ringTime) || 0;

    // Update hold time averages (how long caller waited)
    agent.averageHoldTimeToday = updateAverage(
      agent.averageHoldTimeToday,
      agent.answeredCallsToday,
      holdTimeSeconds
    );
    agent.averageHoldTimeOverall = updateAverage(
      agent.averageHoldTimeOverall,
      agent.answeredCallsOverall,
      holdTimeSeconds
    );

    // Update ring time averages (how long agent phone rang)
    agent.averageRingTimeToday = updateAverage(
      agent.averageRingTimeToday,
      agent.answeredCallsToday,
      ringTimeSeconds
    );
    agent.averageRingTimeOverall = updateAverage(
      agent.averageRingTimeOverall,
      agent.answeredCallsOverall,
      ringTimeSeconds
    );

    // Update agent status
    agent.deviceState = "INUSE";
    agent.liveStatus = "In Use";
    agent.lastActivity = new Date();
    agent.currentCallStart = new Date();

    // Stop idle timer if running
    stopIdleTimer(username);

    // Save to database and emit updates
    await saveAgentStats(username);
    await emitAgentStatusOnly(io);

    console.log(
      `✅ Successfully incremented answered calls for agent ${username}`
    );
  } catch (error) {
    console.error(
      `❌ Error incrementing answered calls for agent ${username}:`,
      error
    );
  }
}

// Save agent stats to database
async function saveAgentStats(username) {
  try {
    const agent = state.agents[username];
    if (!agent) return;

    await Agent.findOneAndUpdate(
      { username },
      {
        totalCallsToday: agent.totalCallsToday,
        answeredCallsToday: agent.answeredCallsToday,
        missedCallsToday: agent.missedCallsToday,
        averageTalkTimeToday: agent.averageTalkTimeToday,
        averageWrapTimeToday: agent.averageWrapTimeToday,
        averageHoldTimeToday: agent.averageHoldTimeToday,
        averageRingTimeToday: agent.averageRingTimeToday,
        longestIdleTimeToday: agent.longestIdleTimeToday,
        totalCallsOverall: agent.totalCallsOverall,
        answeredCallsOverall: agent.answeredCallsOverall,
        missedCallsOverall: agent.missedCallsOverall,
        averageTalkTimeOverall: agent.averageTalkTimeOverall,
        averageWrapTimeOverall: agent.averageWrapTimeOverall,
        averageHoldTimeOverall: agent.averageHoldTimeOverall,
        averageRingTimeOverall: agent.averageRingTimeOverall,
        longestIdleTimeOverall: agent.longestIdleTimeOverall,
      },
      { upsert: true }
    );
  } catch (error) {
    console.error(`Error saving agent stats for ${username}:`, error);
  }
}

// Map device state to live status
function mapDeviceStateToLiveStatus(deviceState) {
  switch (deviceState) {
    case "NOT_INUSE":
      return "Idle";
    case "INUSE":
      return "In Use";
    case "BUSY":
      return "Busy";
    case "RINGING":
      return "Ringing";
    case "UNAVAILABLE":
      return "Unavailable";
    default:
      return "Unknown";
  }
}

// Start idle timer for agent
function startIdleTimer(username) {
  if (state.idleTimers[username]) {
    clearInterval(state.idleTimers[username]);
  }

  const startTime = Date.now();
  state.idleTimers[username] = setInterval(async () => {
    const agent = state.agents[username];
    if (agent && agent.liveStatus === "Idle") {
      const idleTime = Math.floor((Date.now() - startTime) / 1000);
      if (idleTime > agent.longestIdleTimeToday) {
        agent.longestIdleTimeToday = idleTime;
      }
      if (idleTime > agent.longestIdleTimeOverall) {
        agent.longestIdleTimeOverall = idleTime;
      }
    }
  }, 60000); // Check every minute
}

// Stop idle timer for agent
function stopIdleTimer(username) {
  if (state.idleTimers[username]) {
    clearInterval(state.idleTimers[username]);
    delete state.idleTimers[username];
  }
}

// Query AMI for current agent status using PJSIPShowEndpoints (bulk query)
async function queryAllAgentStatus(ami) {
  return new Promise((resolve) => {
    if (!global.ami || !global.amiReady) {
      resolve({});
      return;
    }

    const agentStatuses = {};
    let completed = false;

    // Handler for EndpointList events
    const onEndpointList = (event) => {
      const extension = event.ObjectName;
      if (extension) {
        agentStatuses[extension] = {
          deviceState: event.DeviceState || "UNAVAILABLE",
          contacts: event.Contacts || "",
          transport: event.Transport || "",
          state: event.State || "Offline",
        };
      }
    };

    const onEndpointListComplete = () => {
      completed = true;
      cleanup();

      resolve(agentStatuses);
    };

    // Cleanup function to remove listeners
    const cleanup = () => {
      global.ami.removeListener("EndpointList", onEndpointList);
      global.ami.removeListener("EndpointListComplete", onEndpointListComplete);
    };

    // Set timeout to prevent hanging
    setTimeout(() => {
      if (!completed) {
        cleanup();

        resolve({});
        AgentRingNoAnswer;
      }
    }, 5000);

    // Listen for events
    global.ami.on("EndpointList", onEndpointList);
    global.ami.on("EndpointListComplete", onEndpointListComplete);

    // Send the action to trigger events
    global.ami.action({ Action: "PJSIPShowEndpoints" });
  });
}

// Load all agents from database and query their real-time status
async function loadAllAgentsWithStatus(ami) {
  try {
    // Get all agents from Extension model
    const extensions = await Extension.find(
      {},
      { userExtension: 1, displayName: 1, _id: 1 }
    ).lean();

    // Initialize all agents in state if not already present
    for (const ext of extensions) {
      if (!state.agents[ext.userExtension]) {
        await getOrCreateAgent(ext.userExtension);
      }
    }

    // Query real-time status from AMI for all agents
    if (ami && global.amiReady) {
      const allStatuses = await queryAllAgentStatus(ami);

      // Update agent status with AMI data
      for (const extension in allStatuses) {
        const agent = state.agents[extension];
        if (agent) {
          const status = allStatuses[extension];
          agent.deviceState = status.deviceState;
          agent.contacts = status.contacts;
          agent.transport = status.transport;

          // Update live status based on device state
          if (
            status.deviceState === "NOT_INUSE" ||
            status.deviceState === "Not in use"
          ) {
            agent.liveStatus = "Idle";
          } else if (
            status.deviceState === "INUSE" ||
            status.deviceState === "InUse"
          ) {
            agent.liveStatus = "In Use";
          } else if (
            status.deviceState === "UNAVAILABLE" ||
            status.deviceState === "Unavailable"
          ) {
            agent.liveStatus = "Unavailable";
          } else if (
            status.deviceState === "RINGING" ||
            status.deviceState === "Ringing"
          ) {
            agent.liveStatus = "Ringing";
          } else {
            agent.liveStatus = "Unknown";
          }

          agent.lastActivity = new Date();
        }
      }
    }
  } catch (error) {
    console.error("Error loading all agents:", error);
  }
}

// Refresh agent state after CRUD operations
async function refreshAgentState(io) {
  try {
    // Get current extensions from database
    const extensions = await Extension.find(
      {},
      { userExtension: 1, displayName: 1, _id: 1 }
    ).lean();

    const currentExtensions = new Set(
      extensions.map((ext) => ext.userExtension)
    );
    const stateExtensions = new Set(Object.keys(state.agents));

    // Remove deleted agents from state
    for (const username of stateExtensions) {
      if (!currentExtensions.has(username)) {
        delete state.agents[username];
        // Clean up any timers
        if (state.idleTimers[username]) {
          clearInterval(state.idleTimers[username]);
          delete state.idleTimers[username];
        }
      }
    }

    // Add new agents or update existing ones
    for (const ext of extensions) {
      if (!state.agents[ext.userExtension]) {
        // New agent - create in state
        await getOrCreateAgent(ext.userExtension);
      } else {
        // Existing agent - update name if changed
        const agent = state.agents[ext.userExtension];
        const newName = ext.displayName || `Agent ${ext.userExtension}`;
        if (agent.name !== newName) {
          agent.name = newName;
          // Update in database too
          await Agent.findOneAndUpdate(
            { username: ext.userExtension },
            { name: newName }
          );
        }
      }
    }

    // Emit updated agent list
    if (io) {
      await emitAgentStatusOnly(io);
    }
  } catch (error) {
    console.error("Error refreshing agent state:", error);
  }
}

// Force reload all agents from database (for major changes)
async function reloadAllAgents(io) {
  try {
    // Clear current state
    state.agents = {};

    // Clear all timers
    for (const username in state.idleTimers) {
      clearInterval(state.idleTimers[username]);
    }
    state.idleTimers = {};

    // Reload from database
    await loadAllAgentsWithStatus(global.ami);

    // Emit updated agent list
    if (io) {
      await emitAgentStatusOnly(io);
    }
  } catch (error) {
    console.error("Error reloading all agents:", error);
  }
}

// Check if extension exists in database
async function extensionExists(extension) {
  try {
    const exists = await Extension.exists({ userExtension: extension });
    return !!exists;
  } catch (error) {
    console.error(`Error checking if extension ${extension} exists:`, error);
    return false;
  }
}

// Emit enriched agent status with stats (light version - no database reload)
async function emitAgentStatusOnly(io) {
  const enrichedAgents = [];

  for (const username in state.agents) {
    const agent = state.agents[username];
    enrichedAgents.push({
      id: agent.id,
      username: agent.username,
      extension: agent.username,
      first_name: agent.name ? agent.name.split(" ")[0] : "Agent",
      last_name: agent.name
        ? agent.name.split(" ").slice(1).join(" ")
        : agent.username,
      full_name: agent.name || `Agent ${agent.username}`,
      name: agent.name,
      email: agent.email,
      queues: agent.queues,
      deviceState: agent.deviceState,
      liveStatus: agent.liveStatus,
      status:
        agent.deviceState === "NOT_INUSE" || agent.deviceState === "Not in use"
          ? "online"
          : agent.deviceState === "UNAVAILABLE" ||
            agent.deviceState === "Unavailable" ||
            agent.deviceState === "Offline" ||
            agent.deviceState === "OFFLINE"
          ? "offline"
          : agent.deviceState === "INUSE" || agent.deviceState === "InUse"
          ? "busy"
          : agent.deviceState === "RINGING" || agent.deviceState === "Ringing"
          ? "ringing"
          : "offline", // Default to offline for unknown states
      lastActivity: agent.lastActivity,
      contacts: agent.contacts || "",
      transport: agent.transport || "",

      // Daily stats
      dailyStats: {
        totalCalls: agent.totalCallsToday,
        answeredCalls: agent.answeredCallsToday,
        missedCalls: agent.missedCallsToday,
        averageTalkTime: agent.averageTalkTimeToday,
        averageWrapTime: agent.averageWrapTimeToday,
        averageHoldTime: agent.averageHoldTimeToday,
        averageRingTime: agent.averageRingTimeToday,
        longestIdleTime: agent.longestIdleTimeToday,
      },

      // Overall stats
      overallStats: {
        totalCalls: agent.totalCallsOverall,
        answeredCalls: agent.answeredCallsOverall,
        missedCalls: agent.missedCallsOverall,
        averageTalkTime: agent.averageTalkTimeOverall,
        averageWrapTime: agent.averageWrapTimeOverall,
        averageHoldTime: agent.averageHoldTimeOverall,
        averageRingTime: agent.averageRingTimeOverall,
        longestIdleTime: agent.longestIdleTimeOverall,
      },
    });
  }

  io.emit("agentStatusWithStats", enrichedAgents);
}

// Refresh agent status from AMI (periodic function)
async function refreshAgentStatus(io) {
  if (!global.ami || !global.amiReady) {
    return;
  }

  try {
    const allStatuses = await queryAllAgentStatus(global.ami);

    // Update only existing agents with new status
    for (const extension in allStatuses) {
      const agent = state.agents[extension];
      if (agent) {
        const status = allStatuses[extension];
        const oldDeviceState = agent.deviceState;

        agent.deviceState = status.deviceState;
        agent.contacts = status.contacts;
        agent.transport = status.transport;

        // Update live status based on device state
        if (
          status.deviceState === "NOT_INUSE" ||
          status.deviceState === "Not in use"
        ) {
          agent.liveStatus = "Idle";
        } else if (
          status.deviceState === "INUSE" ||
          status.deviceState === "InUse"
        ) {
          agent.liveStatus = "In Use";
        } else if (
          status.deviceState === "UNAVAILABLE" ||
          status.deviceState === "Unavailable"
        ) {
          agent.liveStatus = "Unavailable";
        } else if (
          status.deviceState === "RINGING" ||
          status.deviceState === "Ringing"
        ) {
          agent.liveStatus = "Ringing";
        } else {
          agent.liveStatus = "Unknown";
        }

        // Only update if status actually changed
        if (oldDeviceState !== agent.deviceState) {
          // Status changed - could add logging here if needed
        }

        agent.lastActivity = new Date();
      }
    }

    // Emit the updated status
    await emitAgentStatusOnly(io);
  } catch (error) {
    console.error("Error refreshing agent status:", error);
  }
}

// Full reload with database query (heavy operation - use sparingly)
async function emitAgentStatus(io) {
  // Only reload from database if agents are not loaded
  if (Object.keys(state.agents).length === 0) {
    await loadAllAgentsWithStatus(global.ami);
  }

  // Just emit the current state
  await emitAgentStatusOnly(io);
}

function setupAgentListeners(ami, io) {
  if (!ami) throw new Error("AMI client instance is required");
  if (!io) throw new Error("Socket.IO server instance is required");

  // Listen to ContactStatus events (agent online/offline)
  ami.on("ContactStatus", async (event) => {
    const { EndpointName, ContactStatus } = event;
    if (!EndpointName) return;

    // Skip if extension doesn't exist in our database
    const exists = await extensionExists(EndpointName);
    if (!exists) {
      return;
    }

    const agent = await getOrCreateAgent(EndpointName);

    // Update device state based on contact status
    if (ContactStatus === "Reachable") {
      agent.deviceState = "NOT_INUSE";
      agent.liveStatus = "Idle";
      agent.lastActivity = new Date();
      startIdleTimer(EndpointName);
    } else if (ContactStatus === "Unreachable" || ContactStatus === "Removed") {
      agent.deviceState = "UNAVAILABLE";
      agent.liveStatus = "Unavailable";
      stopIdleTimer(EndpointName);
    }

    await saveAgentStats(EndpointName);
    await emitAgentStatusOnly(io);
  });

  // Listen to AgentCalled events (agent is notified of incoming call) - Track total calls
  ami.on("AgentCalled", async (event) => {
    const { Interface, Queue, CallerIDNum, CallerIDName, Linkedid } = event;

    // Extract username from Interface (e.g., "PJSIP/1006" -> "1006")
    if (!Interface || !Interface.startsWith("Local/")) return;
    const username = Interface.split("/")[1];
    const exact_username = username.split("@")[0];
    if (!username) return;

    // Skip if extension doesn't exist in our database
    const exists = await extensionExists(exact_username);
    if (!exists) {
      return;
    }

    console.log(
      `📞 Agent ${exact_username} called for queue ${Queue} - caller: ${CallerIDNum}`
    );

    const agent = await getOrCreateAgent(exact_username);

    // Increment total calls when agent is notified
    agent.totalCallsToday += 1;
    agent.totalCallsOverall += 1;

    console.log(
      `📊 Agent ${exact_username} total calls - Today: ${agent.totalCallsToday}, Overall: ${agent.totalCallsOverall}`
    );

    // Update agent activity
    agent.lastActivity = new Date();

    // Save to database and emit updates
    await saveAgentStats(username);
    await emitAgentStatusOnly(io);
  });

  // Listen to AgentConnect events (agent answers queue call) - More accurate than BridgeEnter
  ami.on("AgentConnect", async (event) => {
    console.log("Agent Connect Event", event);

    const {
      MemberName,
      Interface,
      Queue,
      CallerIDNum,
      CallerIDName,
      HoldTime,
      RingTime,
      Linkedid,
    } = event;

    // Extract username from Interface (e.g., "Local/1006@from-internal/n" -> "1006")
    if (!Interface || !Interface.startsWith("Local/")) return;
    const username = Interface.split("/")[1];
    const exact_username = username.split("@")[0];
    if (!exact_username) return;

    // Skip if extension doesn't exist in our database
    const exists = await extensionExists(exact_username);
    if (!exists) {
      return;
    }

    console.log(
      `🎯 AgentConnect: Agent ${exact_username} answered call from ${CallerIDNum} in queue ${Queue}`
    );

    // Use the dedicated function to increment answered calls
    await incrementAnsweredCalls(exact_username, HoldTime, RingTime, io);

    // Add to ongoing calls when agent connects (instead of BridgeEnter)
    const amiState = require("../../config/amiConfig").state;
    amiState.ongoingCalls[Linkedid] = {
      caller: CallerIDNum,
      callerName: CallerIDName,
      agent: exact_username,
      agentName: MemberName || `Agent ${exact_username}`,
      state: "Talking",
      startTime: Date.now(),
      queue: Queue,
      queueName: global.queueNameMap?.[Queue] || Queue,
      channels: [Interface], // Agent's interface
    };

    // Emit ongoing calls update
    const { emitOngoingCallsStatus } = require("../../config/amiConfig");
    emitOngoingCallsStatus(io);

    console.log(
      `📞 Added ongoing call ${Linkedid} to dashboard (Agent: ${exact_username})`
    );

    // Store call session for timing with queue info
    state.callSessions[Linkedid] = {
      agent: exact_username,
      startTime: new Date(),
      answered: true,
      queue: Queue,
      callerID: CallerIDNum,
      callerName: CallerIDName,
      holdTime: parseInt(HoldTime) || 0,
      ringTime: parseInt(RingTime) || 0,
    };
  });

  // Listen to Hangup events (call ends)
  ami.on("Hangup", async (event) => {
    const { Linkedid, Channel } = event;
    const callSession = state.callSessions[Linkedid];

    if (!callSession || !Channel || !Channel.startsWith("PJSIP/")) return;

    const username = callSession.agent;

    // Skip if extension doesn't exist in our database
    const exists = await extensionExists(username);
    if (!exists) {
      // Clean up call session even if extension doesn't exist
      delete state.callSessions[Linkedid];
      return;
    }

    const agent = state.agents[username];
    if (!agent) return;

    // Calculate call duration
    const callDuration = Math.floor(
      (new Date() - callSession.startTime) / 1000
    );

    // Update talk time averages
    const totalCalls = agent.totalCallsToday;
    agent.averageTalkTimeToday = updateAverage(
      agent.averageTalkTimeToday,
      totalCalls,
      callDuration
    );
    agent.averageTalkTimeOverall = updateAverage(
      agent.averageTalkTimeOverall,
      agent.totalCallsOverall,
      callDuration
    );

    // Agent is now idle
    agent.deviceState = "NOT_INUSE";
    agent.liveStatus = "Idle";
    agent.lastActivity = new Date();
    agent.currentCallStart = null;

    // Clean up call session
    delete state.callSessions[Linkedid];

    startIdleTimer(username);
    await saveAgentStats(username);
    await emitAgentStatusOnly(io);
  });

  // Listen to AgentRingNoAnswer events (agent missed a queue call) - Much more accurate than QueueCallerAbandon
  ami.on("AgentRingNoAnswer", async (event) => {
    const {
      Interface,
      Queue,
      MemberName,
      CallerIDNum,
      CallerIDName,
      RingTime,
      Linkedid,
    } = event;

    // Extract username from Interface (e.g., "PJSIP/1006" -> "1006")
    if (!Interface || !Interface.startsWith("Local/")) return;
    const username = Interface.split("/")[1];
    const exact_username = username.split("@")[0];
    if (!exact_username) return;

    // Skip if extension doesn't exist in our database
    const exists = await extensionExists(exact_username);
    if (!exists) {
      return;
    }

    const agent = await getOrCreateAgent(exact_username);

    // Agent missed a queue call - increment missed call counters only
    agent.missedCallsToday += 1;
    agent.missedCallsOverall += 1;

    // Note: We don't increment totalCalls for missed calls
    // totalCalls should only represent calls that were actually handled/answered

    // Track ring time for missed calls (how long phone rang before timeout)
    const ringTimeSeconds = parseInt(RingTime) || 0;

    // Update ring time averages including missed calls
    const totalAttempts = agent.totalCallsToday;
    agent.averageRingTimeToday = updateAverage(
      agent.averageRingTimeToday,
      totalAttempts,
      ringTimeSeconds
    );
    agent.averageRingTimeOverall = updateAverage(
      agent.averageRingTimeOverall,
      agent.totalCallsOverall,
      ringTimeSeconds
    );

    // Store missed call info for potential reporting
    const missedCallInfo = {
      agent: username,
      queue: Queue,
      callerID: CallerIDNum,
      callerName: CallerIDName,
      ringTime: ringTimeSeconds,
      timestamp: new Date(),
      linkedId: Linkedid,
    };

    // Agent remains in current state (likely still Idle)
    agent.lastActivity = new Date();

    await saveAgentStats(username);
    await emitAgentStatusOnly(io);
  });

  // Keep QueueCallerAbandon for general queue abandonment tracking (caller hangs up while waiting)
  ami.on("QueueCallerAbandon", async (event) => {
    const { Queue, Position, OriginalPosition, HoldTime } = event;
    // This tracks when callers abandon the queue before any agent is even tried
    // We can use this for queue performance metrics if needed
    // For now, we'll just log it as it doesn't directly affect individual agent stats
  });

  // Reset daily stats at midnight
  const resetDailyStats = async () => {
    for (const username in state.agents) {
      const agent = state.agents[username];
      agent.totalCallsToday = 0;
      agent.answeredCallsToday = 0;
      agent.missedCallsToday = 0;
      agent.averageTalkTimeToday = 0;
      agent.averageWrapTimeToday = 0;
      agent.averageHoldTimeToday = 0;
      agent.averageRingTimeToday = 0;
      agent.longestIdleTimeToday = 0;

      await saveAgentStats(username);
    }

    await emitAgentStatusOnly(io);
  };

  // Schedule daily reset at midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    resetDailyStats();
    // Then set up daily interval
    setInterval(resetDailyStats, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  // Periodic save to database (every 5 minutes)
  setInterval(async () => {
    for (const username in state.agents) {
      await saveAgentStats(username);
    }
  }, 5 * 60 * 1000);

  // Removed periodic status refresh - now using immediate updates only

  // Initial status load - simplified and reliable
  setTimeout(async () => {
    try {
      // Load all agents from Extension database
      const extensions = await Extension.find(
        {},
        { userExtension: 1, displayName: 1, _id: 1 }
      ).lean();

      // Create agents in state
      for (const ext of extensions) {
        await getOrCreateAgent(ext.userExtension);
      }

      // Emit immediately so frontend gets the agents
      await emitAgentStatusOnly(io);
    } catch (error) {
      console.error("❌ Error loading initial agents:", error);
    }
  }, 3000); // Wait 3 seconds for AMI to be ready
}

module.exports = {
  setupAgentListeners,
  state,
  emitAgentStatus,
  emitAgentStatusOnly,
  getOrCreateAgent,
  refreshAgentState,
  reloadAllAgents,
};
