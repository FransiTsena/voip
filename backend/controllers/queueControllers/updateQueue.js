const { loadQueueNamesMap } = require('../../config/amiConfig');
const Queue = require('../../models/queue');
const { writeFileWithSudo } = require('../../utils/sudo');
const { generateAsteriskQueueConfig, reloadAsteriskQueues } = require('./queueConfigGenerator');

// Update a queue by _id, processing the data like createQueue
const updateQueue = async (req, res) => {
  try {
    const {
      generalSettings,
      queueAgents,
      timingAgentOptions,
      capacityOptions
    } = req.body;

    const queueId = req.params.queueId;

    // Validate required fields
    if (!generalSettings.queueName || !generalSettings.queueNumber) {
      return res.status(400).json({
        status: 400,
        error: 'Missing required queueName or queueNumber in generalSettings.'
      });
    }

    // Build update object like createQueue
    const updateObj = {
      name: generalSettings.queueName,
      queueId: generalSettings.queueNumber,
      generalSettings,
      queueAgents,
      timingAgentOptions,
      capacityOptions
    };


    // Update in DB
    const updatedQueue = await Queue.findByIdAndUpdate(queueId, updateObj, { new: true });
    if (!updatedQueue) {
      return res.status(404).json({ status: 404, error: 'Queue not found' });
    }
        await loadQueueNamesMap();
    // After update, regenerate config for all queues
    const allQueues = await Queue.find({});
    let combinedAsteriskConfig = '';
    for (const queue of allQueues) {
      combinedAsteriskConfig += generateAsteriskQueueConfig(queue);
    }
    const configPath = '/etc/asterisk/queues_custom.conf';
    await writeFileWithSudo(configPath, combinedAsteriskConfig);
    await reloadAsteriskQueues();
    res.status(200).json({ status: 200, message: 'Queue updated successfully', updatedQueue });
  } catch (error) {
    console.error('Error updating queue:', error);
    res.status(500).json({ status: 500, error: 'Failed to update queue', details: error.message });
  }
};

module.exports = { updateQueue };
