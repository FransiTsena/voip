const fs = require('fs');
const ini = require('ini');
const { exec } = require('child_process');
const Queue = require('../models/queue');
const asyncHandler = require('express-async-handler');
const Extension = require('../models/extension');

const QUEUE_CUSTOM_CONF_PATH = "/etc/asterisk/queues_custom.conf";

// --- Utility Functions ---
function loadConfig(path) {
  return ini.parse(fs.readFileSync(path, 'utf-8'));
}

function reloadPJSIP() {
  exec('sudo asterisk -rx "core reload"', (error, stdout, stderr) => {
    if (error) return console.error(`[PJSIP] Error reloading PJSIP: ${error.message}`);
    if (stderr) return console.error(`[PJSIP] Reload stderr: ${stderr}`);
    console.log('[PJSIP] Reloaded successfully:', stdout.trim());
  });
}

// Map camelCase JS keys to kebab-case config keys
function toKebabCaseConfig(options) {
  const mapping = {
    announceFrequency: 'announce-frequency',
    announceHoldtime: 'announce-holdtime',
    announcePosition: 'announce-position',
    autofill: 'autofill',
    autopause: 'autopause',
    autopausebusy: 'autopausebusy',
    autopausedelay: 'autopausedelay',
    autopauseunavail: 'autopauseunavail',
    joinempty: 'joinempty',
    leavewhenempty: 'leavewhenempty',
    maxlen: 'maxlen',
    memberdelay: 'memberdelay',
    minAnnounceFrequency: 'min-announce-frequency',
    penaltymemberslimit: 'penaltymemberslimit',
    periodicAnnounceFrequency: 'periodic-announce-frequency',
    queueCallsWaiting: 'queue-callswaiting',
    queueThereAre: 'queue-thereare',
    queueYouAreNext: 'queue-youarenext',
    reportholdtime: 'reportholdtime',
    retry: 'retry',
    ringinuse: 'ringinuse',
    servicelevel: 'servicelevel',
    strategy: 'strategy',
    timeout: 'timeout',
    timeoutpriority: 'timeoutpriority',
    timeoutrestart: 'timeoutrestart',
    weight: 'weight',
    wrapuptime: 'wrapuptime',
    context: 'context'
  };
  const config = {};
  for (const [key, value] of Object.entries(options)) {
    if (mapping[key] !== undefined && value !== undefined && value !== null && value !== '') {
      config[mapping[key]] = value;
    }
  }
  return config;
}

function saveConfig(config, path) {
  let output = '';

  for (const section in config) {
    output += `[${section}]\n`;
    for (const key in config[section]) {
      // Skip unwanted fields like __v and members
      if (key === '__v' || key === 'members') continue;
      const val = config[section][key];
      if (Array.isArray(val)) {
        // Write each array element as a separate line with the key
        val.forEach(v => {
          if (v !== undefined && v !== null && v !== '') {
            output += `${key}=${v}\n`;
          }
        });
      } else if (val !== undefined && val !== null && val !== '') {
        output += `${key}=${val}\n`;
      }
    }
    output += '\n';
  }

  fs.writeFileSync(path, output);
  console.log('Config saved');
}

function upsertQueueConfig(queueId, options, members = []) {
  const config = loadConfig(QUEUE_CUSTOM_CONF_PATH);

  // Filter out unwanted fields and convert to kebab-case
  const filteredOptions = toKebabCaseConfig(options);

  // Set the queue configuration
  config[queueId] = { ...filteredOptions };

  // Handle members explicitly
  if (members.length > 0) {
    config[queueId]['member'] = members.map(m => `PJSIP/${m}`);
  } else {
    delete config[queueId]['member'];
  }

  saveConfig(config, QUEUE_CUSTOM_CONF_PATH);
}

function removeQueueConfig(queueId) {
  const config = loadConfig(QUEUE_CUSTOM_CONF_PATH);
  if (config[queueId]) {
    delete config[queueId];
    saveConfig(config, QUEUE_CUSTOM_CONF_PATH);
    console.log(`[PJSIP] QUEUE ${queueId} removed successfully`);
  }
}

function appendQueueMembers(queueId, members = []) {
  const config = loadConfig(QUEUE_CUSTOM_CONF_PATH);

  // Ensure the queue section exists
  if (!config[queueId]) {
    config[queueId] = {};
  }

  // Initialize member array if it doesn't exist
  if (!config[queueId]['member']) {
    config[queueId]['member'] = [];
  } else if (!Array.isArray(config[queueId]['member'])) {
    // Convert single string to array if necessary
    config[queueId]['member'] = config[queueId]['member'].split('\n').filter(line => line.startsWith('member=')).map(line => line.replace('member=', ''));
  }

  // Append new members if they don't already exist
  if (Array.isArray(members) && members.length > 0) {
    members.forEach(ext => {
      const memberEntry = `PJSIP/${ext}`;
      if (!config[queueId]['member'].includes(memberEntry)) {
        config[queueId]['member'].push(memberEntry);
      }
    });
  }

  saveConfig(config, QUEUE_CUSTOM_CONF_PATH);
  console.log(`[PJSIP] Members appended to QUEUE ${queueId} successfully`);
}

const errorResponse = (res, code, msg) => res.status(code).json({ message: msg });

// --- Controller Functions ---

// Create a new queue (config + MongoDB + reload)
const createQueue = asyncHandler(async (req, res) => {
  const { queueId, members = [], ...rest } = req.body;
  if (!queueId) return errorResponse(res, 400, 'queueId is required.');
  const existing = await Queue.findOne({ queueId });
  if (existing) return errorResponse(res, 409, 'Queue with this ID already exists.');
  console.log(`[PJSIP] Creating queue ${queueId}...`);
  console.log(`[PJSIP] Members: ${members}`);
  console.log(`[PJSIP] Rest: ${rest}`);
  try {
    console.log(`[PJSIP] Upserting queue ${queueId}...`);
    upsertQueueConfig(queueId, rest, members);
    reloadPJSIP();
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update config file. Not saved to MongoDB.', error: err.message });
  }
  const queueDoc = new Queue({ queueId, members, ...rest });
  await queueDoc.save();
  res.status(201).json({ message: 'Queue registered successfully in both MongoDB and config file.', queue: queueDoc });
});

// Get all queues from MongoDB
const getAllQueues = asyncHandler(async (req, res) => {
  const queues = await Queue.find();
  res.json(queues);
});

// Get a specific queue by id from MongoDB
const getQueue = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  const queue = await Queue.findOne({ queueId });
  if (!queue) return errorResponse(res, 404, 'Queue not found');
  res.json(queue);
});

// Get all members of a queue
const getQueueMember = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  if (!queueId) return errorResponse(res, 400, 'queueId is required.');
  const queue = await Queue.findOne({ queueId });
  if (!queue) return errorResponse(res, 404, 'Queue not found');
  if (!queue.members || queue.members.length === 0) return errorResponse(res, 404, 'No members found in this queue');
  res.json(queue.members);
});

// Update a26 a queue (config + MongoDB + reload)
const updateQueue = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  const { members, ...rest } = req.body;
  if (!queueId) return errorResponse(res, 400, 'queueId is required.');
  try {
    upsertQueueConfig(queueId, rest, members);
    reloadPJSIP();
  } catch (err) {
    return res.status(500).json({ message: ' Failed to update config file.', error: err.message });
  }
  const updated = await Queue.findOneAndUpdate(
    { queueId },
    { $set: { ...rest, ...(members !== undefined ? { members } : {}) } },
    { new: true }
  );
  if (!updated) return errorResponse(res, 404, 'Queue not found');
  res.json({ message: 'Queue updated successfully in both MongoDB and config file.', queue: updated });
});

// Delete a queue (config + MongoDB + reload)
const deleteQueue = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  console.log(queueId)
  console.log(queueId)
  console.log(queueId)
  console.log(queueId)
  if (!queueId) return errorResponse(res, 400, 'queueId is required.');
  try {
    removeQueueConfig(queueId);
    reloadPJSIP();
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update config file.', error: err.message });
  }
  const deleted = await Queue.findOneAndDelete({ queueId });
  if (!deleted) return errorResponse(res, 404, 'Queue not found');
  res.json({ message: 'Queue deleted successfully from both MongoDB and config file.', queue: deleted });
});

// Add a member to a queue
const addMemberToQueue = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  const { member } = req.body;
  console.log(req.body)
  if (!queueId || !member) return errorResponse(res, 400, 'queueId and member are required.');
  const queue = await Queue.findOne({ queueId });
  if (!queue) return errorResponse(res, 404, 'Queue not found');

  const agent = await Extension.findOne({ extension: member });
  if (!agent) return errorResponse(res, 404, 'Agent not found with this extension');

  // Check if member already exists by interface string
  if (queue.members.includes(member)) return errorResponse(res, 409, 'Member already exists in queue');

  queue.members.push(member);
  await queue.save();
  try {
    upsertQueueConfig(queueId, queue.toObject(), queue.members);
    reloadPJSIP();
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update config file.', error: err.message });
  }
  res.json({ message: 'Member added to queue successfully.', queue });
});

// Remove a member from a queue
const removeMemberFromQueue = asyncHandler(async (req, res) => {
  const { queueId, memberId } = req.params;

  if (!queueId || !memberId) return errorResponse(res, 400, 'queueId and member are required.');
  const queue = await Queue.findOne({ queueId });
  if (!queue) return errorResponse(res, 404, 'Queue not found');
  const idx = queue.members.indexOf(memberId);
  if (idx === -1) return errorResponse(res, 404, 'Member not found in queue');

  try {
    queue.members.splice(idx, 1);
    upsertQueueConfig(queueId, queue.toObject(), queue.members);
    await queue.save();
    reloadPJSIP();
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update config file.', error: err.message });
  }
  res.json({ message: 'Member removed from queue successfully.', queue });
});

// Get total count of queues
const getQueueCount = async (req, res) => {
  try {
    const count = await Queue.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get report of waiting callers in each queue
const getQueueWaitingReport = asyncHandler(async (req, res) => {
  try {
    const queueWaitingData = Object.entries(state.queueCallers).map(([queue, callers]) => ({
      queue,
      waitingCount: callers.length,
    }));

    res.status(200).json({ success: true, data: queueWaitingData });
  } catch (error) {
    console.error('Error fetching queue waiting report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch queue waiting report', details: error.message });
  }
});

module.exports = {
  createQueue,
  getAllQueues,
  getQueue,
  updateQueue,
  deleteQueue,
  getQueueMember,
  addMemberToQueue,
  removeMemberFromQueue,
  getQueueCount,
  getQueueWaitingReport,
};