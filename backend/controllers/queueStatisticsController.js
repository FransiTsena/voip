const QueueStatistics = require('../models/queueStatistics');
const Queue = require('../models/queue');
const CallLog = require('../models/callLog');
const asyncHandler = require('express-async-handler');

// Helper function to get start and end of day
const getDateRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Helper function to initialize hourly stats
const initializeHourlyStats = () => {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    calls: 0,
    answered: 0,
    abandoned: 0,
    avgWaitTime: 0,
    avgTalkTime: 0
  }));
};

/**
 * Calculate and update queue statistics for a specific date
 * This should be called daily or can be triggered manually
 */
const calculateQueueStatistics = asyncHandler(async (queueId, date = new Date()) => {
  const { start, end } = getDateRange(date);
  
  // Get queue info
  const queue = await Queue.findOne({ queueId });
  if (!queue) {
    throw new Error(`Queue ${queueId} not found`);
  }

  // Aggregate call data from CallLog
  const callStats = await CallLog.aggregate([
    {
      $match: {
        startTime: { $gte: start, $lte: end },
        // Filter calls that went through this queue (you may need to adjust this based on your CallLog schema)
        $or: [
          { callee: queueId },
          { queue: queueId }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        answeredCalls: { $sum: { $cond: [{ $eq: ['$status', 'answered'] }, 1, 0] } },
        abandonedCalls: { $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] } },
        missedCalls: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } },
        totalWaitTime: { $sum: { $ifNull: ['$waitTime', 0] } },
        totalTalkTime: { $sum: { $ifNull: ['$duration', 0] } },
        totalHoldTime: { $sum: { $ifNull: ['$holdTime', 0] } },
        longestWaitTime: { $max: { $ifNull: ['$waitTime', 0] } },
        shortestWaitTime: { $min: { $ifNull: ['$waitTime', 999999] } },
        callsWithinServiceLevel: {
          $sum: {
            $cond: [
              { $and: [
                { $ne: ['$waitTime', null] },
                { $lte: ['$waitTime', 60] } // 60 seconds service level
              ]},
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const stats = callStats[0] || {
    totalCalls: 0,
    answeredCalls: 0,
    abandonedCalls: 0,
    missedCalls: 0,
    totalWaitTime: 0,
    totalTalkTime: 0,
    totalHoldTime: 0,
    longestWaitTime: 0,
    shortestWaitTime: null,
    callsWithinServiceLevel: 0
  };

  // Calculate averages
  const averageWaitTime = stats.totalCalls > 0 ? stats.totalWaitTime / stats.totalCalls : 0;
  const averageTalkTime = stats.answeredCalls > 0 ? stats.totalTalkTime / stats.answeredCalls : 0;
  const averageHoldTime = stats.answeredCalls > 0 ? stats.totalHoldTime / stats.answeredCalls : 0;
  const serviceLevelPercentage = stats.totalCalls > 0 ? (stats.callsWithinServiceLevel / stats.totalCalls) * 100 : 0;

  // Get hourly breakdown
  const hourlyBreakdown = await CallLog.aggregate([
    {
      $match: {
        startTime: { $gte: start, $lte: end },
        $or: [
          { callee: queueId },
          { queue: queueId }
        ]
      }
    },
    {
      $group: {
        _id: { $hour: '$startTime' },
        calls: { $sum: 1 },
        answered: { $sum: { $cond: [{ $eq: ['$status', 'answered'] }, 1, 0] } },
        abandoned: { $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] } },
        avgWaitTime: { $avg: { $ifNull: ['$waitTime', 0] } },
        avgTalkTime: { $avg: { $ifNull: ['$duration', 0] } }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Initialize hourly stats and populate with actual data
  const hourlyStats = initializeHourlyStats();
  hourlyBreakdown.forEach(hourData => {
    const hour = hourData._id;
    if (hour >= 0 && hour <= 23) {
      hourlyStats[hour] = {
        hour,
        calls: hourData.calls,
        answered: hourData.answered,
        abandoned: hourData.abandoned,
        avgWaitTime: Math.round(hourData.avgWaitTime || 0),
        avgTalkTime: Math.round(hourData.avgTalkTime || 0)
      };
    }
  });

  // Find peak statistics
  const peakCallVolume = Math.max(...hourlyStats.map(h => h.calls));
  const peakCallVolumeHour = hourlyStats.find(h => h.calls === peakCallVolume)?.hour || 0;

  // Prepare statistics document
  const statisticsData = {
    queueId,
    queueName: queue.name,
    date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    
    // Call Volume
    totalCalls: stats.totalCalls,
    answeredCalls: stats.answeredCalls,
    abandonedCalls: stats.abandonedCalls,
    missedCalls: stats.missedCalls,
    
    // Time-based
    totalWaitTime: stats.totalWaitTime,
    totalTalkTime: stats.totalTalkTime,
    totalHoldTime: stats.totalHoldTime,
    averageWaitTime: Math.round(averageWaitTime),
    averageTalkTime: Math.round(averageTalkTime),
    averageHoldTime: Math.round(averageHoldTime),
    longestWaitTime: stats.longestWaitTime,
    shortestWaitTime: stats.shortestWaitTime === 999999 ? null : stats.shortestWaitTime,
    
    // Service Level
    serviceLevelTarget: 60,
    callsWithinServiceLevel: stats.callsWithinServiceLevel,
    serviceLevelPercentage: Math.round(serviceLevelPercentage * 100) / 100,
    
    // Peak Statistics
    peakCallVolume,
    peakCallVolumeHour,
    
    // Hourly breakdown
    hourlyStats,
    
    lastUpdated: new Date(),
    isComplete: true
  };

  // Upsert the statistics
  const result = await QueueStatistics.findOneAndUpdate(
    { queueId, date: statisticsData.date },
    statisticsData,
    { upsert: true, new: true }
  );

  return result;
});

/**
 * Get queue statistics for a specific date range
 */
const getQueueStatistics = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  const { startDate, endDate, period = 'daily' } = req.query;

  if (!queueId) {
    return res.status(400).json({ message: 'Queue ID is required' });
  }

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
  const end = endDate ? new Date(endDate) : new Date();

  let statistics;

  if (period === 'summary') {
    // Get aggregated summary
    statistics = await QueueStatistics.getQueueSummary(queueId, start, end);
  } else {
    // Get daily statistics
    statistics = await QueueStatistics.find({
      queueId,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 });
  }

  res.json({
    success: true,
    queueId,
    period,
    startDate: start,
    endDate: end,
    data: statistics
  });
});

/**
 * Get statistics for all queues
 */
const getAllQueuesStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
  const end = endDate ? new Date(endDate) : new Date();

  const statistics = await QueueStatistics.getTopPerformingQueues(start, end, parseInt(limit));

  res.json({
    success: true,
    startDate: start,
    endDate: end,
    data: statistics
  });
});

/**
 * Get hourly trends for a specific queue and date
 */
const getQueueHourlyTrends = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  const { date } = req.query;

  if (!queueId || !date) {
    return res.status(400).json({ message: 'Queue ID and date are required' });
  }

  const targetDate = new Date(date);
  const hourlyStats = await QueueStatistics.getHourlyTrends(queueId, targetDate);

  res.json({
    success: true,
    queueId,
    date: targetDate,
    hourlyTrends: hourlyStats
  });
});

/**
 * Manually trigger statistics calculation for a queue
 */
const triggerStatisticsCalculation = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  const { date } = req.body;

  const targetDate = date ? new Date(date) : new Date();

  try {
    const statistics = await calculateQueueStatistics(queueId, targetDate);
    res.json({
      success: true,
      message: 'Statistics calculated successfully',
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate statistics',
      error: error.message
    });
  }
});

/**
 * Calculate statistics for all queues for a specific date
 */
const calculateAllQueuesStatistics = asyncHandler(async (req, res) => {
  const { date } = req.body;
  const targetDate = date ? new Date(date) : new Date();

  try {
    const queues = await Queue.find({}, { queueId: 1 });
    const results = [];

    for (const queue of queues) {
      try {
        const statistics = await calculateQueueStatistics(queue.queueId, targetDate);
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

    res.json({
      success: true,
      message: `Statistics calculated for ${results.length} queues`,
      date: targetDate,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate statistics for all queues',
      error: error.message
    });
  }
});

/**
 * Get queue performance comparison
 */
const getQueueComparison = asyncHandler(async (req, res) => {
  const { queueIds, startDate, endDate } = req.query;

  if (!queueIds) {
    return res.status(400).json({ message: 'Queue IDs are required' });
  }

  const queueIdArray = queueIds.split(',');
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const comparison = await QueueStatistics.aggregate([
    {
      $match: {
        queueId: { $in: queueIdArray },
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$queueId',
        queueName: { $first: '$queueName' },
        totalCalls: { $sum: '$totalCalls' },
        answeredCalls: { $sum: '$answeredCalls' },
        abandonedCalls: { $sum: '$abandonedCalls' },
        avgWaitTime: { $avg: '$averageWaitTime' },
        avgTalkTime: { $avg: '$averageTalkTime' },
        avgServiceLevel: { $avg: '$serviceLevelPercentage' },
        peakVolume: { $max: '$peakCallVolume' }
      }
    },
    {
      $addFields: {
        answerRate: {
          $cond: [
            { $gt: ['$totalCalls', 0] },
            { $multiply: [{ $divide: ['$answeredCalls', '$totalCalls'] }, 100] },
            0
          ]
        },
        abandonmentRate: {
          $cond: [
            { $gt: ['$totalCalls', 0] },
            { $multiply: [{ $divide: ['$abandonedCalls', '$totalCalls'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { totalCalls: -1 } }
  ]);

  res.json({
    success: true,
    startDate: start,
    endDate: end,
    comparison
  });
});

module.exports = {
  calculateQueueStatistics,
  getQueueStatistics,
  getAllQueuesStatistics,
  getQueueHourlyTrends,
  triggerStatisticsCalculation,
  calculateAllQueuesStatistics,
  getQueueComparison
};