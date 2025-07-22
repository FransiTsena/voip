const Queue = require("../../models/queue");
const { writeFileWithSudo } = require("../../utils/sudo");
const { generateAsteriskQueueConfig, reloadAsteriskQueues } = require("./queueController");

const deleteAllQueues = async (req, res) => {
    try {
      // Delete all documents from the Queue collection
      const result = await Queue.deleteMany({});
      console.log(`Deleted ${result.deletedCount} queues from the database.`);
  
      // After deleting from the database, regenerate an empty queues_custom.conf
      // and reload Asterisk to reflect the changes.
      const configPath = '/etc/asterisk/queues_custom.conf';
      try {
        // There are no queues left, so config should be empty
        await writeFileWithSudo(configPath, '');
        await reloadAsteriskQueues();

        res.status(200).json({
          status: 200,
          message: `Successfully deleted ${result.deletedCount} queues and reconfigured Asterisk.`,
        });
      } catch (error) {
        console.error('Error clearing Asterisk queue configuration or reloading:', error);
        res.status(500).json({
          status: 500,
          error: 'Failed to clear Asterisk queue configuration or reload Asterisk',
          details: error.message
        });
      }
    } catch (error) {
      console.error('Error deleting all queues:', error);
      res.status(500).json({
        status: 500,
        error: 'Failed to delete all queues from the database',
        details: error.message
      });
    }
  };
module.exports = {deleteAllQueues}  