const Queue = require('../../models/queue'); // Path to your new Queue model
const { exec } = require('child_process');
const util = require('util');
const { writeFileWithSudo } = require('../../utils/sudo'); // Assuming this utility exists
const { generateAsteriskQueueConfig, reloadAsteriskQueues } = require('./queueConfigGenerator');
const { loadQueueNamesMap } = require('../../config/amiConfig');
const execPromise = util.promisify(exec);

// Main: Create Queue and regenerate all Queues in config
const createQueue = async (req, res) => {
  try {
    const {
      generalSettings,
      queueAgents,
      timingAgentOptions,
      capacityOptions
    } = req.body;

    const name = generalSettings?.queueName;
    const queueNumber = generalSettings?.queueNumber; // This will be used for queueId

    // 1. Validate required fields
    if (!name || !queueNumber) {
      return res.status(400).json({
        status: 400,
        message: "Queue name and queue number are required",
        error: "Missing required queue fields"
      });
    }

    // 2. Create the new Queue document, mapping incoming JSON to schema fields
    const newQueue = new Queue({
      queueId: queueNumber, // Map queueNumber from generalSettings to top-level queueId
      name: name, // Map queueName from generalSettings to top-level name
      description: generalSettings?.description || '', // Assuming description might be in generalSettings or default
      announceFrequency: generalSettings?.announceFrequency || 0,
      announceHoldtime: (generalSettings?.announceHoldtime || 'no').toLowerCase(),
      announcePosition: (generalSettings?.announcePosition || 'no').toLowerCase(),
      autofill: (generalSettings?.autofill || 'no').toLowerCase(), // Fixed: Ensure string before toLowerCase()
      autopause: (timingAgentOptions?.autoPause || 'no').toLowerCase(), // Fixed: Ensure string before toLowerCase()
      autopausebusy: (timingAgentOptions?.autoPauseOnBusy || 'no').toLowerCase(), // Fixed: Ensure string before toLowerCase()
      autopausedelay: timingAgentOptions?.autoPauseDelay || 0,
      autopauseunavail: (timingAgentOptions?.autoPauseOnUnavailable || 'no').toLowerCase(), // Fixed: Ensure string before toLowerCase()
      joinempty: (capacityOptions?.joinEmpty || 'yes').toLowerCase(), // Fixed: Ensure string before toLowerCase()
      leavewhenempty: (capacityOptions?.leaveEmpty || 'no').toLowerCase(), // Fixed: Ensure string before toLowerCase()
      maxlen: capacityOptions?.maxCallers || 0, // Ensure this is a number
      memberdelay: parseInt(timingAgentOptions?.memberDelay) || 0, // Convert to number
      minAnnounceFrequency: generalSettings?.minAnnounceFrequency || 15,
      // penaltymemberslimit: capacityOptions?.penaltyMembersLimit || 0, // This field is a Number in schema but string in JSON. Defaulting to 0.
      // If 'Honor Penalties' needs specific numeric mapping, adjust here.
      penaltymemberslimit: (capacityOptions?.penaltyMembersLimit === 'Honor Penalties' ? 0 : parseInt(capacityOptions?.penaltyMembersLimit)) || 0,
      periodicAnnounceFrequency: generalSettings?.periodicAnnounceFrequency || 0,
      queueCallsWaiting: generalSettings?.queueCallsWaiting || 'silence/1',
      queueThereAre: generalSettings?.queueThereAre || 'silence/1',
      queueYouAreNext: generalSettings?.queueYouAreNext || 'silence/1',
      reportholdtime: (timingAgentOptions?.reportHoldTime || 'no').toLowerCase(), // Fixed: Ensure string before toLowerCase()
      retry: parseInt(timingAgentOptions?.retry) || 5, // Convert to number
      ringinuse: ((generalSettings?.skipBusyAgents || 'no').toLowerCase() === 'yes' ? 'no' : 'yes'), // Fixed: Ensure string before toLowerCase()
      servicelevel: generalSettings?.servicelevel || 60,
      strategy: (generalSettings?.ringStrategy || 'ringall').toLowerCase(), // Fixed: Ensure string before toLowerCase()
      timeout: parseInt(timingAgentOptions?.agentTimeout) || 15, // Convert to number
      timeoutpriority: generalSettings?.timeoutpriority || 'app',
      timeoutrestart: (timingAgentOptions?.agentTimeoutRestart || 'no').toLowerCase(), // Fixed: Ensure string before toLowerCase()
      weight: generalSettings?.queueWeight || 0,
      wrapuptime: parseInt(timingAgentOptions?.wrapUpTime) || 0, // Convert to number
      context: generalSettings?.context || '', // Assuming context might be in generalSettings or default
      members: (queueAgents || []).map(agent => agent.extension), // Map agent extensions to top-level members array

      // Store the original nested objects as well, as per your schema
      generalSettings: {
        ...generalSettings,
        queueNoAnswer: generalSettings?.queueNoAnswer || 'No',
        callConfirm: generalSettings?.callConfirm || 'No',
        callConfirmAnnounce: generalSettings?.callConfirmAnnounce || 'Default',
        cidNamePrefix: generalSettings?.cidNamePrefix || '',
        waitTimePrefix: generalSettings?.waitTimePrefix || 'No',
        alertInfo: generalSettings?.alertInfo || 'None',
        ringerVolumeOverride: generalSettings?.ringerVolumeOverride || '',
        ringerVolumeOverrideMode: generalSettings?.ringerVolumeOverrideMode || 'No',
        restrictDynamicAgents: generalSettings?.restrictDynamicAgents || 'No',
        agentRestrictions: generalSettings?.agentRestrictions || 'Call as Dialed',
        ringStrategy: generalSettings?.ringStrategy || 'ringall',
        autofill: generalSettings?.autofill || 'No',
        skipBusyAgents: generalSettings?.skipBusyAgents || 'No',
        queueWeight: generalSettings?.queueWeight || 0,
        musicOnHoldClass: generalSettings?.musicOnHoldClass || 'inherit',
        joinAnnouncement: generalSettings?.joinAnnouncement || 'None',
        callRecording: generalSettings?.callRecording || 'No',
        markCallsAnsweredElsewhere: generalSettings?.markCallsAnsweredElsewhere || 'No',
        failOverDestination: generalSettings?.failOverDestination || 'playRecordings'
      },
      queueAgents: queueAgents || [],
      timingAgentOptions: {
        ...timingAgentOptions,
        maxWaitTime: timingAgentOptions?.maxWaitTime || 'Unlimited',
        maxWaitTimeMode: timingAgentOptions?.maxWaitTimeMode || 'Strict',
        agentTimeout: timingAgentOptions?.agentTimeout || '15',
        agentTimeoutRestart: timingAgentOptions?.agentTimeoutRestart || 'No',
        retry: timingAgentOptions?.retry || '5',
        wrapUpTime: timingAgentOptions?.wrapUpTime || '0',
        memberDelay: timingAgentOptions?.memberDelay || '0',
        agentAnnouncement: timingAgentOptions?.agentAnnouncement || 'None',
        reportHoldTime: timingAgentOptions?.reportHoldTime || 'No',
        autoPause: timingAgentOptions?.autoPause || 'No',
        autoPauseOnBusy: timingAgentOptions?.autoPauseOnBusy || 'No',
        autoPauseOnUnavailable: timingAgentOptions?.autoPauseOnUnavailable || 'No',
        autoPauseDelay: timingAgentOptions?.autoPauseDelay || 0
      },
      capacityOptions: {
        ...capacityOptions,
        maxCallers: capacityOptions?.maxCallers || 100,
        joinEmpty: capacityOptions?.joinEmpty || 'Yes',
        leaveEmpty: capacityOptions?.leaveEmpty || 'No',
        penaltyMembersLimit: capacityOptions?.penaltyMembersLimit || 'Honor Penalties'
      }
    });
    await newQueue.save();
    // 3. Load the queue names map to ensure we have the latest queue names for the ami event listeners
    // This is important to ensure that the AMI event listeners have the latest queue names available
    await loadQueueNamesMap()
    // 3. Fetch all Queue menus from the database
    const allQueues = await Queue.find({});

    let combinedAsteriskConfig = '';
    for (const queue of allQueues) {
      combinedAsteriskConfig += generateAsteriskQueueConfig(queue);
    }

    // 4. Write the combined config to file and reload Asterisk
    const configPath = '/etc/asterisk/queues_custom.conf'; // Dedicated file for custom queues
    try {
      await writeFileWithSudo(configPath, combinedAsteriskConfig);
      await reloadAsteriskQueues();

      res.status(201).json({
        status: 201,
        message: 'Queue created and all queues reconfigured successfully',
        queue: newQueue,
        // config: combinedAsteriskConfig // Uncomment for debugging if needed
      });
    } catch (error) {
      console.error('Error saving Asterisk queue configuration or reloading:', error);
      // If config save fails, delete the queue we just created to prevent inconsistencies
      await Queue.findByIdAndDelete(newQueue._id);

      res.status(500).json({
        status: 500,
        error: 'Failed to save Asterisk queue configuration or reload Asterisk',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Error creating queue:', error);
    // Handle duplicate key errors specifically for unique fields
    if (error.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: "A queue with this name or number already exists.",
        error: error.message
      });
    }
    res.status(500).json({
      status: 500,
      error: 'Failed to create queue',
      details: error.message
    });
  }
};

// Delete a single queue by _id
const deleteQueue = async (req, res) => {
  const { queueId } = req.params;
  try {
    const deletedQueue = await Queue.findByIdAndDelete(queueId);
    if (!deletedQueue) {
      return res.status(404).json({ status: 404, error: 'Queue not found' });
    }

    // After deletion, regenerate config for remaining queues
    const allQueues = await Queue.find({});
    let combinedAsteriskConfig = '';
    for (const queue of allQueues) {
      combinedAsteriskConfig += generateAsteriskQueueConfig(queue);
    }
    const configPath = '/etc/asterisk/queues_custom.conf';
    await writeFileWithSudo(configPath, combinedAsteriskConfig);
    await reloadAsteriskQueues();

    res.status(200).json({ status: 200, message: 'Queue deleted successfully', deletedQueue });
  } catch (error) {
    console.error('Error deleting queue:', error);
    res.status(500).json({ status: 500, error: 'Failed to delete queue', details: error.message });
  }
};

// Fetch all queues
const getAllQueues = async (req, res) => {
  try {
    const queues = await Queue.find({});
    res.status(200).json( queues );
  } catch (error) {
    console.error('Error fetching queues:', error);
    res.status(500).json({ status: 500, error: 'Failed to fetch queues', details: error.message });
  }
};

// Get a single queue by _id
const getQueueById = async (req, res) => {
  const { queueId } = req.params;

  try {
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ status: 404, error: 'Queue not found' });
    }
    res.status(200).json(queue );
  } catch (error) {
    console.error('Error fetching queue by ID:', error);
    res.status(500).json({ status: 500, error: 'Failed to fetch queue', details: error.message });
  }
};

// Edit/update a queue by _id

// Delete all queues
const deleteAllQueues = async (req, res) => {
  try {
    await Queue.deleteMany({});
    const configPath = '/etc/asterisk/queues_custom.conf';
    await writeFileWithSudo(configPath, ''); // Clear config file
    await reloadAsteriskQueues();
    res.status(200).json({ status: 200, message: 'All queues deleted and config cleared.' });
  } catch (error) {
    console.error('Error deleting all queues:', error);
    res.status(500).json({ status: 500, error: 'Failed to delete all queues', details: error.message });
  }
};



module.exports = {
  createQueue,
  deleteQueue,
  getAllQueues,
  getQueueById,
  deleteAllQueues,
};
