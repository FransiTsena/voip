require("dotenv").config();
const fs = require("fs");
const ini = require("ini");
const { exec } = require("child_process");
// AMI is now available globally
const Extension = require("../models/extension");
const e = require("express");
// const hashPassword = require('../utils/hashPassword');
// const axios = require('axios');

// Config file paths
const PJSIP_CUSTOM_CONF_PATH = "/etc/asterisk/pjsip.endpoint_custom.conf";
const AOR_CUSTOM_CONF_PATH = "/etc/asterisk/pjsip.aor_custom.conf";
const AUTH_CUSTOM_CONF_PATH = "/etc/asterisk/pjsip.auth_custom.conf";

// Helper: load INI config
function loadConfig(configPath) {
  console.log("[PJSIP] Loading config from", configPath);
  return ini.parse(fs.readFileSync(configPath, "utf-8"));
}

// Helper: save INI config
function saveConfig(config, configPath) {
  console.log("[PJSIP] Saving config to", configPath);
  fs.writeFileSync(configPath, ini.stringify(config, { whitespace: true }));
  console.log("[PJSIP] Config saved successfully");
}

// Helper: reload PJSIP
function reloadPJSIP() {
  exec('sudo asterisk -rx "core reload"', (error, stdout, stderr) => {
    if (error)
      return console.error(`[PJSIP] Error reloading PJSIP: ${error.message}`);
    if (stderr) return console.error(`[PJSIP] Reload stderr: ${stderr}`);
    console.log("[PJSIP] Reloaded successfully:", stdout.trim());
  });
}

// Helper: error response
function errorResponse(res, status, message) {
  return res.status(status).json({ error: message });
}

// Utility: sanitize object by allowed fields
function sanitizeObject(obj, allowedFields) {
  const sanitized = {};
  for (const key of Object.keys(obj)) {
    if (allowedFields.includes(key)) {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
}

// Utility: async error handler wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) =>
      errorResponse(res, 500, err.message)
    );
  };
}

function addAOR(extension) {
  const config = loadConfig(AOR_CUSTOM_CONF_PATH);
  if (config[extension]) throw new Error("AOR already exists");
  config[extension] = {
    type: "aor",
    max_contacts: 4,
    remove_existing: "yes",
    maximum_expiration: 7200,
    minimum_expiration: 60,
    qualify_frequency: 60,
  };
  saveConfig(config, AOR_CUSTOM_CONF_PATH);
  console.log(`[PJSIP] AOR ${extension} added successfully`);
}

function addAUTH(options) {
  const config = loadConfig(AUTH_CUSTOM_CONF_PATH);
  const auth = options["username"];
  if (config[`${auth}-auth`]) throw new Error("Auth section already exists");
  config[`${auth}-auth`] = options;
  saveConfig(config, AUTH_CUSTOM_CONF_PATH);
  console.log(`[PJSIP] AUTH ${auth}-auth added successfully`);
}

function removeUser(username) {
  // Remove from endpoint
  const endpointConfig = loadConfig(PJSIP_CUSTOM_CONF_PATH);
  if (!endpointConfig[username])
    throw new Error("User does not exist in endpoint");
  delete endpointConfig[username];
  saveConfig(endpointConfig, PJSIP_CUSTOM_CONF_PATH);
  // Remove from AOR
  const aorConfig = loadConfig(AOR_CUSTOM_CONF_PATH);
  if (aorConfig[username]) {
    delete aorConfig[username];
    saveConfig(aorConfig, AOR_CUSTOM_CONF_PATH);
  }
  // Remove from AUTH
  const authConfig = loadConfig(AUTH_CUSTOM_CONF_PATH);
  if (authConfig[`${username}-auth`]) {
    delete authConfig[`${username}-auth`];
    saveConfig(authConfig, AUTH_CUSTOM_CONF_PATH);
  }
  console.log(
    `[PJSIP] User ${username} removed from all config files successfully`
  );
}

// Update agent status (e.g., online/offline)
const updateAgentStatusRoute = asyncHandler(async (req, res) => {
  const { extension, status } = req.body;
  if (!extension || !status) {
    return errorResponse(res, 400, "extension and status are required.");
  }
  const allowedStatuses = ["online", "offline", "busy", "away"];
  if (!allowedStatuses.includes(status)) {
    return errorResponse(res, 400, "Invalid status value.");
  }
  const agent = await Agent.findOneAndUpdate(
    { extension },
    { $set: { status } },
    { new: true }
  );
  if (!agent) return errorResponse(res, 404, "Agent not found.");
  res.json({ message: "Agent status updated.", agent });
});

// Update agent/extension information
const updateAgentInfo = asyncHandler(async (req, res) => {
  const { extension } = req.params;
  const { displayName, secret } = req.body;
  
  if (!extension) {
    return errorResponse(res, 400, "Extension is required.");
  }

  // Update in database
  const updateData = {};
  if (displayName) updateData.displayName = displayName;
  if (secret) updateData.secret = secret;

  const updatedExtension = await Extension.findOneAndUpdate(
    { userExtension: extension },
    updateData,
    { new: true }
  );

  if (!updatedExtension) {
    return errorResponse(res, 404, "Extension not found.");
  }

  // 🔄 REFRESH AGENT STATE - Update agent info in real-time tracking
  const { refreshAgentState } = require('./agentControllers/realTimeAgent');
  await refreshAgentState(global.io);

  res.json({
    success: true,
    message: "Agent information updated successfully.",
    agent: updatedExtension
  });
});

// Create new agent/extension
const createAgent = asyncHandler(async (req, res) => {
  const { userExtension, displayName, secret } = req.body;
  
  if (!userExtension || !displayName || !secret) {
    return errorResponse(res, 400, "userExtension, displayName, and secret are required.");
  }

  // Check if extension already exists
  const existing = await Extension.findOne({ userExtension });
  if (existing) {
    return errorResponse(res, 409, "Extension already exists.");
  }

  // Create new extension
  const newExtension = new Extension({
    userExtension,
    displayName,
    secret
  });

  await newExtension.save();

  // Add to PJSIP configuration if needed
  try {
    addAOR(userExtension);
    addAUTH({
      type: "auth",
      auth_type: "userpass",
      password: secret,
      username: userExtension,
    });
    reloadPJSIP();
  } catch (pjsipError) {
    console.error("PJSIP configuration error:", pjsipError.message);
    // Continue anyway - database record is created
  }

  // 🔄 REFRESH AGENT STATE - Add new agent to real-time tracking
  const { refreshAgentState } = require('./agentControllers/realTimeAgent');
  await refreshAgentState(global.io);

  res.status(201).json({
    success: true,
    message: "Agent created successfully.",
    agent: newExtension
  });
});

// Get all agents (with basic info, no passwords)

// Get all extensions using AMI (PJSIPShowEndpoints)
async function getAllAgents(req, res) {
  try {
    console.log("[PJSIP] Fetching all agents from AMI");
    console.log(global.amiReady, global.ami);
    console.log("[PJSIP] Fetching all agents from AMI");
    if (!global.amiReady || !global.ami) {
      return res
        .status(503)
        .json({ error: "Asterisk AMI is not connected yet." });
    }
    let endpoints = [];
    let completed = false;

    // Handler for EndpointList events
    const onEndpointList = (event) => {
      console.log("[PJSIP] EndpointList event received:", event);
      console.log(event);
      endpoints.push(event);
    };
    const onEndpointListComplete = (event) => {
      completed = true;
      cleanup();
      const extensionList = endpoints.map((e) => ({
        exten: e.ObjectName,
        aor: e.AOR,
        state: e.State,
        contacts: e.Contacts,
        transport: e.Transport,
        identifyBy: e.IdentifyBy,
        deviceState: e.DeviceState,
        // eventType: e.Event
      }));
      return res.status(200).json(extensionList);
    };

    // Cleanup function to remove listeners
    const cleanup = () => {
      global.ami.removeListener("EndpointList", onEndpointList);
      global.ami.removeListener("EndpointListComplete", onEndpointListComplete);
    };

    // Listen for EndpointList and EndpointListComplete events BEFORE sending the action
    global.ami.on("EndpointList", onEndpointList);
    global.ami.on("EndpointListComplete", onEndpointListComplete);

    // Send the action to trigger events
    await global.ami.action({ Action: "PJSIPShowEndpoints" });

    // Timeout in case EndpointListComplete is not received
    setTimeout(() => {
      if (!completed) {
        cleanup();
        return res
          .status(504)
          .json({ error: "Timeout waiting for EndpointListComplete event." });
      }
    }, 5000);
  } catch (error) {
    res.status(500).json({ error: error.message, details: error });
  }
}

async function getAgentByNumber(req, res, next) {
  try {
    const hasExtensions = await Extension.exists({});
    if (!hasExtensions) {
      return res.status(200).json([]);
    }
    const number = req.params.number || req.query.extension;
    if (!number) {
      return res.status(400).json({ error: "extension is required." });
    }
    const ageny = await Extension.findOne({ extension: number });
    if (!ageny) {
      return res.status(404).json({ error: "Agent not found." });
    } else {
      const agentData = {
        extension: ageny.extension,
        first_name: ageny.first_name,
        last_name: ageny.last_name,
        status: ageny.status || "offline",
        aors: ageny.aors,
        auth: ageny.auth,
        createdAt: ageny.createdAt,
        updatedAt: ageny.updatedAt,
      };
      return res.status(200).json(agentData);
    }
  } catch (error) {
    res.status(500).json({ error: error.message, details: error });
  }
}

// Delete a single agent/extension
const deleteSingleAgents = asyncHandler(async (req, res) => {
  const { extension } = req.body;
  if (!extension) return errorResponse(res, 400, "extension is required.");
  const extDoc = await Extension.findOneAndDelete({ userExtension: extension });
  if (!extDoc) return errorResponse(res, 404, "Extension not found.");
  try {
    removeUser(extension);
    reloadPJSIP();
  } catch (err) {
    return errorResponse(
      res,
      500,
      "Failed to remove extension in mini server: " + err.message
    );
  }

  // 🔄 REFRESH AGENT STATE - Remove deleted agent from real-time tracking
  const { refreshAgentState } = require('./agentControllers/realTimeAgent');
  await refreshAgentState(global.io);

  res.json({ message: "Extension deleted successfully." });
});

// Get all agent call statuses (dummy example, adapt as needed)
const getAllAgentCallStatus = asyncHandler(async (req, res) => {
  const agents = await Extension.find({}, "extension status");
  res.json({ agents });
});

// Get agent call logic by ID or extension
const getAgentCallLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) return errorResponse(res, 400, "ID is required.");
  const agent = await Extension.findById(id);
  if (!agent) return errorResponse(res, 404, "Agent not found.");
  res.json(agent);
});

// Get total count of agents
const getAgentCount = async (req, res) => {
  try {
    const count = await Extension.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
const getAgentsFromDatabase = async (req, res) => {
  try {
    const agents = await Extension.find({});
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get real-time agent status from AMI state
const getRealTimeAgentStatus = async (req, res) => {
  try {
    if (!global.amiReady || !global.ami) {
      return res
        .status(503)
        .json({ error: "Asterisk AMI is not connected yet." });
    }

    // Import state from realTimeAgent
    const { state } = require("./agentControllers/realTimeAgent");
    
    // Get enriched agent data similar to the socket emission
    const agents = await Extension.find({}, { userExtension: 1, displayName: 1, _id: 1 }).lean();
    const agentDataMap = {};
    agents.forEach(agent => {
      // Parse displayName to get first and last name
      const nameParts = agent.displayName ? agent.displayName.split(' ') : ['Agent', agent.userExtension];
      const firstName = nameParts[0] || 'Agent';
      const lastName = nameParts.slice(1).join(' ') || agent.userExtension;
      
      agentDataMap[agent.userExtension] = {
        id: agent._id,
        extension: agent.userExtension,
        first_name: firstName,
        last_name: lastName,
        full_name: agent.displayName || `Agent ${agent.userExtension}`,
        displayName: agent.displayName
      };
    });

    console.log(`🔍 Found ${agents.length} agents in database`);
    console.log(`📊 Found ${Object.keys(state.agents || {}).length} agents in realTimeAgent state`);

    // If no agents in realTimeAgent state, try to load them
    if (Object.keys(state.agents || {}).length === 0) {
      console.log('⚠️ No agents in realTimeAgent state, loading from database...');
      const { getOrCreateAgent } = require("./agentControllers/realTimeAgent");
      
      for (const agent of agents) {
        await getOrCreateAgent(agent.userExtension);
      }
      console.log(`✅ Loaded ${Object.keys(state.agents).length} agents into realTimeAgent state`);
    }

    // Map real-time status with database info using realTimeAgent state
    const enrichedAgents = [];
    
    for (const agent of agents) {
      const realtimeAgent = state.agents[agent.userExtension];
      const nameParts = agent.displayName ? agent.displayName.split(' ') : ['Agent', agent.userExtension];
      const firstName = nameParts[0] || 'Agent';
      const lastName = nameParts.slice(1).join(' ') || agent.userExtension;
      
      enrichedAgents.push({
        id: agent._id,
        extension: agent.userExtension,
        first_name: firstName,
        last_name: lastName,
        full_name: agent.displayName || `Agent ${agent.userExtension}`,
        status: realtimeAgent ? (realtimeAgent.deviceState === 'NOT_INUSE' ? 'online' : 
                                realtimeAgent.deviceState === 'UNAVAILABLE' ? 'offline' : 'busy') : 'offline',
        deviceState: realtimeAgent ? realtimeAgent.deviceState : 'UNAVAILABLE',
        liveStatus: realtimeAgent ? realtimeAgent.liveStatus : 'Unavailable',
        contacts: realtimeAgent ? realtimeAgent.contacts : '',
        transport: realtimeAgent ? realtimeAgent.transport : '',
        lastActivity: realtimeAgent ? realtimeAgent.lastActivity : null,
        dailyStats: realtimeAgent ? {
          totalCalls: realtimeAgent.totalCallsToday,
          missedCalls: realtimeAgent.missedCallsToday,
          averageTalkTime: realtimeAgent.averageTalkTimeToday,
          averageWrapTime: realtimeAgent.averageWrapTimeToday,
          longestIdleTime: realtimeAgent.longestIdleTimeToday,
        } : {
          totalCalls: 0,
          missedCalls: 0,
          averageTalkTime: 0,
          averageWrapTime: 0,
          longestIdleTime: 0,
        },
        overallStats: realtimeAgent ? {
          totalCalls: realtimeAgent.totalCallsOverall,
          missedCalls: realtimeAgent.missedCallsOverall,
          averageTalkTime: realtimeAgent.averageTalkTimeOverall,
          averageWrapTime: realtimeAgent.averageWrapTimeOverall,
          longestIdleTime: realtimeAgent.longestIdleTimeOverall,
        } : {
          totalCalls: 0,
          missedCalls: 0,
          averageTalkTime: 0,
          averageWrapTime: 0,
          longestIdleTime: 0,
        }
      });
    }

    res.json({
      success: true,
      agents: enrichedAgents,
      timestamp: new Date(),
      totalAgents: enrichedAgents.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Manual trigger for agent status emission (for debugging)
const triggerAgentStatusEmission = async (req, res) => {
  try {
    console.log('🔧 Manual trigger: Emitting agent status...');
    
    const { emitAgentStatusOnly } = require('./agentControllers/realTimeAgent');
    
    // Get io from global or app locals
    const io = req.app.get('io') || global.io;
    
    if (!io) {
      return res.status(500).json({ 
        success: false, 
        error: 'Socket.IO instance not available' 
      });
    }
    
    await emitAgentStatusOnly(io);
    
    res.json({
      success: true,
      message: 'Agent status emission triggered successfully',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error triggering agent status emission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Manual refresh of agent state cache (for administrators)
const refreshAgentCache = asyncHandler(async (req, res) => {
  try {
    const { refreshAgentState, reloadAllAgents } = require('./agentControllers/realTimeAgent');
    const { forceReload } = req.query;
    
    if (forceReload === 'true') {
      // Force complete reload from database
      await reloadAllAgents(global.io);
      res.json({
        success: true,
        message: 'Agent cache completely reloaded from database',
        timestamp: new Date()
      });
    } else {
      // Smart refresh - sync with database changes
      await refreshAgentState(global.io);
      res.json({
        success: true,
        message: 'Agent cache refreshed and synced with database',
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('❌ Error refreshing agent cache:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = {
  updateAgentStatusRoute,
  updateAgentInfo,
  createAgent,
  getAllAgents,
  deleteSingleAgents,
  getAllAgentCallStatus,
  getAgentCallLogById,
  getAgentCount,
  getAgentsFromDatabase,
  getAgentByNumber,
  getRealTimeAgentStatus,
  triggerAgentStatusEmission,
  refreshAgentCache,
};
