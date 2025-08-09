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
  const extDoc = await Extension.findOneAndDelete({ extension });
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

    // Import state from amiConfig
    const { state } = require("../config/amiConfig");
    
    // Get enriched agent data similar to the socket emission
    const agents = await Extension.find({}, { extension: 1, first_name: 1, last_name: 1, _id: 1 }).lean();
    const agentDataMap = {};
    agents.forEach(agent => {
      agentDataMap[agent.extension] = {
        id: agent._id,
        extension: agent.extension,
        first_name: agent.first_name,
        last_name: agent.last_name,
        full_name: `${agent.first_name} ${agent.last_name}`
      };
    });

    // Map real-time status with database info
    const enrichedAgents = Object.values(state.agentStatus || {}).map(agentStatus => {
      const agentData = agentDataMap[agentStatus.extension] || {};
      return {
        id: agentData.id || null,
        extension: agentStatus.extension,
        first_name: agentData.first_name || 'Unknown',
        last_name: agentData.last_name || 'Agent',
        full_name: agentData.full_name || `Agent ${agentStatus.extension}`,
        status: agentStatus.status,
        state: agentStatus.state,
        contacts: agentStatus.contacts,
        deviceState: agentStatus.deviceState,
        lastUpdated: agentStatus.lastUpdated,
        // Include AMI data for debugging if needed
        aor: agentStatus.aor,
        transport: agentStatus.transport
      };
    });

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
module.exports = {
  updateAgentStatusRoute,
  getAllAgents,
  deleteSingleAgents,
  getAllAgentCallStatus,
  getAgentCallLogById,
  getAgentCount,
  getAgentsFromDatabase,
  getAgentByNumber,
  getRealTimeAgentStatus,
};
