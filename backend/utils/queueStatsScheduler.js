const cron = require('node-cron');
const { calculateAllQueuesStatistics } = require('../controllers/queueStatisticsController');
const Queue = require('../models/queue');

/**
 * Schedule daily queue statistics calculation
 * Runs every day at 12:05 AM to calculate previous day's statistics
 */
const scheduleQueueStatsCalculation = () => {
  // Run daily at 12:05 AM
  cron.schedule('5 0 * * *', async () => {
    console.log('🕐 Starting scheduled queue statistics calculation...');
    
    try {
      // Calculate statistics for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const queues = await Queue.find({}, { queueId: 1 });
      const results = [];

      for (const queue of queues) {
        try {
          const { calculateQueueStatistics } = require('../controllers/queueStatisticsController');
          const statistics = await calculateQueueStatistics(queue.queueId, yesterday);
          results.push({
            queueId: queue.queueId,
            success: true,
            statistics
          });
          console.log(`✅ Statistics calculated for queue ${queue.queueId}`);
        } catch (error) {
          results.push({
            queueId: queue.queueId,
            success: false,
            error: error.message
          });
          console.error(`❌ Failed to calculate statistics for queue ${queue.queueId}:`, error.message);
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      console.log(`📊 Queue statistics calculation completed: ${successCount} successful, ${failCount} failed`);
      
    } catch (error) {
      console.error('❌ Error in scheduled queue statistics calculation:', error);
    }
  });

  // Also run at server startup for today's partial statistics
  setTimeout(async () => {
    console.log('🚀 Calculating initial queue statistics for today...');
    try {
      const queues = await Queue.find({}, { queueId: 1 });
      for (const queue of queues) {
        try {
          const { calculateQueueStatistics } = require('../controllers/queueStatisticsController');
          await calculateQueueStatistics(queue.queueId, new Date());
        } catch (error) {
          console.error(`Error calculating initial stats for queue ${queue.queueId}:`, error.message);
        }
      }
      console.log('✅ Initial queue statistics calculation completed');
    } catch (error) {
      console.error('❌ Error in initial queue statistics calculation:', error);
    }
  }, 10000); // Wait 10 seconds after server start

  console.log('📅 Queue statistics scheduler initialized');
};

/**
 * Calculate statistics for a specific date range for all queues
 * Useful for backfilling historical data
 */
const backfillQueueStatistics = async (startDate, endDate) => {
  console.log(`🔄 Backfilling queue statistics from ${startDate} to ${endDate}...`);
  
  const queues = await Queue.find({}, { queueId: 1 });
  const results = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Iterate through each date
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const currentDate = new Date(date);
    console.log(`📊 Processing date: ${currentDate.toDateString()}`);
    
    for (const queue of queues) {
      try {
        const { calculateQueueStatistics } = require('../controllers/queueStatisticsController');
        const statistics = await calculateQueueStatistics(queue.queueId, currentDate);
        results.push({
          date: currentDate.toDateString(),
          queueId: queue.queueId,
          success: true,
          statistics
        });
      } catch (error) {
        results.push({
          date: currentDate.toDateString(),
          queueId: queue.queueId,
          success: false,
          error: error.message
        });
        console.error(`❌ Failed to calculate statistics for queue ${queue.queueId} on ${currentDate.toDateString()}:`, error.message);
      }
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Backfill completed: ${successCount} successful, ${failCount} failed`);
  return results;
};

/**
 * Recalculate statistics for today (useful for real-time updates)
 */
const recalculateTodayStats = async () => {
  console.log('🔄 Recalculating today\'s queue statistics...');
  
  try {
    const queues = await Queue.find({}, { queueId: 1 });
    const today = new Date();
    const results = [];

    for (const queue of queues) {
      try {
        const { calculateQueueStatistics } = require('../controllers/queueStatisticsController');
        const statistics = await calculateQueueStatistics(queue.queueId, today);
        results.push({
          queueId: queue.queueId,
          success: true,
          statistics
        });
      } catch (error) {
        results.push({
          queueId: queue.queueId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Today's statistics recalculated for ${successCount} queues`);
    return results;
    
  } catch (error) {
    console.error('❌ Error recalculating today\'s statistics:', error);
    throw error;
  }
};

module.exports = {
  scheduleQueueStatsCalculation,
  backfillQueueStatistics,
  recalculateTodayStats
};