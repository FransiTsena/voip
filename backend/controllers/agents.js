require('dotenv').config();
const fs = require('fs');
const ini = require('ini');
const { exec } = require('child_process');
const { ami } = require('../config/amiConfig');
const Extension = require('../models/extension');
const e = require('express');
// const hashPassword = require('../utils/hashPassword');
// const axios = require('axios');

// Config file paths
const PJSIP_CUSTOM_CONF_PATH = "/etc/asterisk/pjsip.endpoint_custom.conf";
const AOR_CUSTOM_CONF_PATH = "/etc/asterisk/pjsip.aor_custom.conf";
const AUTH_CUSTOM_CONF_PATH = "/etc/asterisk/pjsip.auth_custom.conf";

// Helper: load INI config
function loadConfig(configPath) {
  console.log('[PJSIP] Loading config from', configPath);
  return ini.parse(fs.readFileSync(configPath, 'utf-8'));
}

// Helper: save INI config
function saveConfig(config, configPath) {
  console.log('[PJSIP] Saving config to', configPath);
  fs.writeFileSync(configPath, ini.stringify(config, { whitespace: true }));
  console.log('[PJSIP] Config saved successfully');
}

// Helper: reload PJSIP
function reloadPJSIP() {
  exec('sudo asterisk -rx "core reload"', (error, stdout, stderr) => {
    if (error) return console.error(`[PJSIP] Error reloading PJSIP: ${error.message}`);
    if (stderr) return console.error(`[PJSIP] Reload stderr: ${stderr}`);
    console.log('[PJSIP] Reloaded successfully:', stdout.trim());
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
    Promise.resolve(fn(req, res, next)).catch(err => errorResponse(res, 500, err.message));
  };
}

function addExtension(extension) {
  const config = loadConfig(PJSIP_CUSTOM_CONF_PATH);
  if (config[extension]) throw new Error('User already exists');
  config[extension] = {
    "type": "endpoint",
    "aors": extension,
    "auth": `${extension}-auth`,
    "tos_audio": "ef",
    "tos_video": "af41",
    "cos_audio": 5,
    "cos_video": 4,
    "allow": "ulaw,alaw,gsm,g726,g722",
    "context": "from-internal",
    "callerid": `Agent 2 <${extension}>`,
    "dtmf_mode": "rfc4733",
    "direct_media": "yes",
    "aggregate_mwi": "yes",
    "use_avpf": "no",
    "rtcp_mux": "no",
    "max_audio_streams": 1,
    "max_video_streams": 1,
    "bundle": "no",
    "ice_support": "no",
    "media_use_received_transport": "no",
    "trust_id_inbound": "yes",
    "user_eq_phone": "no",
    "send_connected_line": "yes",
    "media_encryption": "no",
    "timers": "yes",
    "timers_min_se": 90,
    "media_encryption_optimistic": "no",
    "refer_blind_progress": "yes",
    "rtp_timeout": 30,
    "rtp_timeout_hold": 300,
    "rtp_keepalive": 0,
    "send_pai": "yes",
    "rtp_symmetric": "yes",
    "rewrite_contact": "yes",
    "force_rport": "yes",
    "language": "en",
    "one_touch_recording": "on",
    "record_on_feature": "apprecord",
    "record_off_feature": "apprecord",
    "transport": "0.0.0.0-ws",
    "webrtc": "yes"
  };
  saveConfig(config, PJSIP_CUSTOM_CONF_PATH);
  console.log(`[PJSIP] EXTENSION ${extension} added successfully`);
}

function addAOR(extension) {
  const config = loadConfig(AOR_CUSTOM_CONF_PATH);
  if (config[extension]) throw new Error('AOR already exists');
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
  if (config[`${auth}-auth`]) throw new Error('Auth section already exists');
  config[`${auth}-auth`] = options;
  saveConfig(config, AUTH_CUSTOM_CONF_PATH);
  console.log(`[PJSIP] AUTH ${auth}-auth added successfully`);
}


function removeUser(username) {
  // Remove from endpoint
  const endpointConfig = loadConfig(PJSIP_CUSTOM_CONF_PATH);
  if (!endpointConfig[username]) throw new Error('User does not exist in endpoint');
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
  console.log(`[PJSIP] User ${username} removed from all config files successfully`);
}



function modifyUser(username, options) {
  // Define allowed fields for each config type
  const endpointFields = [
    "type", "aors", "auth", "tos_audio", "tos_video", "cos_audio", "cos_video", "allow", "context", "callerid", "dtmf_mode", "direct_media", "aggregate_mwi", "use_avpf", "rtcp_mux", "max_audio_streams", "max_video_streams", "bundle", "ice_support", "media_use_received_transport", "trust_id_inbound", "user_eq_phone", "send_connected_line", "media_encryption", "timers", "timers_min_se", "media_encryption_optimistic", "refer_blind_progress", "rtp_timeout", "rtp_timeout_hold", "rtp_keepalive", "send_pai", "rtp_symmetric", "rewrite_contact", "force_rport", "language", "one_touch_recording", "record_on_feature", "record_off_feature", "transport", "webrtc"
  ];
  const aorFields = [
    "type", "max_contacts", "remove_existing", "maximum_expiration", "minimum_expiration", "qualify_frequency"
  ];
  const authFields = [
    "type", "auth_type", "password", "username"
  ];

  // Modify endpoint
  const endpointConfig = loadConfig(PJSIP_CUSTOM_CONF_PATH);
  if (endpointConfig[username]) {
    const endpointUpdates = sanitizeObject(options, endpointFields);
    endpointConfig[username] = { ...endpointConfig[username], ...endpointUpdates };
    saveConfig(endpointConfig, PJSIP_CUSTOM_CONF_PATH);
  }
  // Modify AOR
  const aorConfig = loadConfig(AOR_CUSTOM_CONF_PATH);
  if (aorConfig[username]) {
    const aorUpdates = sanitizeObject(options, aorFields);
    aorConfig[username] = { ...aorConfig[username], ...aorUpdates };
    saveConfig(aorConfig, AOR_CUSTOM_CONF_PATH);
  }
  // Modify AUTH
  const authConfig = loadConfig(AUTH_CUSTOM_CONF_PATH);
  if (authConfig[`${username}-auth`]) {
    const authUpdates = sanitizeObject(options, authFields);
    authConfig[`${username}-auth`] = { ...authConfig[`${username}-auth`], ...authUpdates };
    saveConfig(authConfig, AUTH_CUSTOM_CONF_PATH);
  }
  console.log(`[PJSIP] User ${username} modified in all config files successfully`);
}

// Register Agent using both MongoDB and mini server (pjsip/app.js)
const registerAgent = asyncHandler(async (req, res) => {
  const { first_name, last_name, extension, password, device } = req.body;
  if (!first_name || !last_name || !extension || !password)
    return errorResponse(res, 400, 'first_name, last_name, extension, and password are required.');
  // Check for duplicate extension in MongoDB (Extension model)
  const existing = await Extension.findOne({ extension });
  if (existing)
    return errorResponse(res, 409, 'Extension with this number already exists.');
  try {
    addExtension(extension);
    addAOR(extension);
    addAUTH({
      type: "auth",
      auth_type: "userpass",
      password: password,
      username: extension,
    });
    reloadPJSIP();
  } catch (miniServerError) {
    return res.status(500).json({
      message: 'Failed to register extension in mini server. Not saved to MongoDB.',
      miniServerError: miniServerError.message
    });
  }
  // Save to MongoDB (Extension model)
  const extensionDoc = new Extension({
    first_name,
    last_name,
    extension,
    password,
    aors: extension,
    auth: `${extension}-auth`,
  });
  await extensionDoc.save();
  res.status(201).json({
    message: 'Extension registered successfully in both MongoDB and mini server.',
    extension: extensionDoc
  });
});

// Modify an agent's details (extension info)
const modifyAgent = asyncHandler(async (req, res) => {
  const { extension, updates } = req.body;
  if (!extension || typeof updates !== 'object') {
    return errorResponse(res, 400, 'extension and updates object are required.');
  }
  const allowedFields = [
    'first_name', 'last_name', 'password', 'context', 'disallow', 'allow',
    'direct_media', 'callerid', 'webrtc', 'transport', 'dtmf_mode',
    'force_rport', 'rewrite_contact', 'ice_support', 'media_encryption',
    'rtcp_mux', 'max_contacts', 'remove_existing', 'maximum_expiration',
    'minimum_expiration', 'qualify_frequency'
  ];
  const sanitizedUpdates = sanitizeObject(updates, allowedFields);
  if (Object.keys(sanitizedUpdates).length === 0) {
    return errorResponse(res, 400, 'No valid fields to update.');
  }
  const extDoc = await Extension.findOneAndUpdate(
    { extension },
    { $set: sanitizedUpdates },
    { new: true }
  );
  if (!extDoc) return errorResponse(res, 404, 'Extension not found.');
  try {
    modifyUser(extension, sanitizedUpdates);
    reloadPJSIP();
  } catch (err) {
    return errorResponse(res, 500, 'Failed to update extension in mini server: ' + err.message);
  }
  res.json({ message: 'Extension updated successfully.', extension: extDoc });
});

// Update agent status (e.g., online/offline)
const updateAgentStatusRoute = asyncHandler(async (req, res) => {
  const { extension, status } = req.body;
  if (!extension || !status) {
    return errorResponse(res, 400, 'extension and status are required.');
  }
  const allowedStatuses = ['online', 'offline', 'busy', 'away'];
  if (!allowedStatuses.includes(status)) {
    return errorResponse(res, 400, 'Invalid status value.');
  }
  const agent = await Agent.findOneAndUpdate(
    { extension },
    { $set: { status } },
    { new: true }
  );
  if (!agent) return errorResponse(res, 404, 'Agent not found.');
  res.json({ message: 'Agent status updated.', agent });
});

// Get all agents (with basic info, no passwords)

// Get all extensions using AMI (PJSIPShowEndpoints)
async function getAllAgents(req, res, next) {
  try {
    console.log('[PJSIP] Fetching all agents from AMI');
    if (!global.amiReady || !ami) {
      return res.status(503).json({ error: 'Asterisk AMI is not connected yet.' });
    }
    let endpoints = [];
    let completed = false;

    // Handler for EndpointList events
    const onEndpointList = (event) => {
      console.log(event)
      endpoints.push(event);
    };
    const onEndpointListComplete = (event) => {
      completed = true;
      cleanup();
      const extensionList = endpoints.map(e => ({
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
      ami.removeListener('EndpointList', onEndpointList);
      ami.removeListener('EndpointListComplete', onEndpointListComplete);
    };

    // Listen for EndpointList and EndpointListComplete events BEFORE sending the action
    ami.on('EndpointList', onEndpointList);
    ami.on('EndpointListComplete', onEndpointListComplete);

    // Send the action to trigger events
    await ami.action({ Action: "PJSIPShowEndpoints" });

    // Timeout in case EndpointListComplete is not received
    setTimeout(() => {
      if (!completed) {
        cleanup();
        return res.status(504).json({ error: 'Timeout waiting for EndpointListComplete event.' });
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
      return res.status(400).json({ error: 'extension is required.' });
    }
    const ageny = await Extension.findOne({ extension: number });
    if (!ageny) {
      return res.status(404).json({ error: 'Agent not found.' });
    } else {
      const agentData = {
        extension: ageny.extension,
        first_name: ageny.first_name,
        last_name: ageny.last_name,
        status: ageny.status || 'offline',
        aors: ageny.aors,
        auth: ageny.auth,
        createdAt: ageny.createdAt,
        updatedAt: ageny.updatedAt
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
  if (!extension) return errorResponse(res, 400, 'extension is required.');
  const extDoc = await Extension.findOneAndDelete({ extension });
  if (!extDoc) return errorResponse(res, 404, 'Extension not found.');
  try {
    removeUser(extension);
    reloadPJSIP();
  } catch (err) {
    return errorResponse(res, 500, 'Failed to remove extension in mini server: ' + err.message);
  }
  res.json({ message: 'Extension deleted successfully.' });
});

// Get all agent call statuses (dummy example, adapt as needed)
const getAllAgentCallStatus = asyncHandler(async (req, res) => {
  const agents = await Extension.find({}, 'extension status');
  res.json({ agents });
});


// Check if extension exists by ID param (for /agents/:id)
const checkExtensionExists = asyncHandler(async (req, res) => {
  const extension = req.params.id || req.query.extension;
  if (!extension) return errorResponse(res, 400, 'extension is required.');
  const exists = await Extension.exists({ extension });
  res.json({ exists: !!exists });
});

// Get total count of agents
getAgentCount = async (req, res) => {
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
module.exports = {
  registerAgent,
  modifyAgent,
  updateAgentStatusRoute,
  getAllAgents,
  deleteSingleAgents,
  getAllAgentCallStatus,
  checkExtensionExists,
  getAgentCount,
  getAgentsFromDatabase,
  getAgentByNumber
};
