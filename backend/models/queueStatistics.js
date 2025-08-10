const mongoose = require('mongoose');

const queueStatisticsSchema = new mongoose.Schema({
  queueId: { type: String, required: true, index: true },
  queueName: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  
  // Call Volume Statistics
  totalCalls: { type: Number, default: 0 },
  answeredCalls: { type: Number, default: 0 },
  abandonedCalls: { type: Number, default: 0 },
  missedCalls: { type: Number, default: 0 },
  
  // Time-based Statistics
  totalWaitTime: { type: Number, default: 0 }, // in seconds
  totalTalkTime: { type: Number, default: 0 }, // in seconds
  totalHoldTime: { type: Number, default: 0 }, // in seconds
  averageWaitTime: { type: Number, default: 0 },
  averageTalkTime: { type: Number, default: 0 },
  averageHoldTime: { type: Number, default: 0 },
  longestWaitTime: { type: Number, default: 0 },
  shortestWaitTime: { type: Number, default: null },
  
  // Service Level Statistics
  serviceLevelTarget: { type: Number, default: 60 }, // seconds
  callsWithinServiceLevel: { type: Number, default: 0 },
  serviceLevelPercentage: { type: Number, default: 0 },
  
  // Peak Statistics
  peakWaitingCallers: { type: Number, default: 0 },
  peakWaitingTime: { type: Date },
  peakCallVolume: { type: Number, default: 0 },
  peakCallVolumeHour: { type: Number }, // 0-23
  
  // Agent Performance in Queue
  activeAgents: { type: Number, default: 0 },
  totalAgentTime: { type: Number, default: 0 }, // total time agents were available
  agentUtilization: { type: Number, default: 0 }, // percentage
  
  // Hourly Breakdown
  hourlyStats: [{
    hour: { type: Number, min: 0, max: 23 },
    calls: { type: Number, default: 0 },
    answered: { type: Number, default: 0 },
    abandoned: { type: Number, default: 0 },
    avgWaitTime: { type: Number, default: 0 },
    avgTalkTime: { type: Number, default: 0 }
  }],
  
  // Additional Metrics
  firstCallResponseTime: { type: Number, default: 0 },
  callResolutionRate: { type: Number, default: 0 },
  transferRate: { type: Number, default: 0 },
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  isComplete: { type: Boolean, default: false } // marks if day is complete
}, { 
  timestamps: true,
  // Compound index for efficient queries
  indexes: [
    { queueId: 1, date: 1 },
    { date: 1 },
    { queueId: 1, date: -1 }
  ]
});

// Virtual for calculated fields
queueStatisticsSchema.virtual('answerRate').get(function() {
  return this.totalCalls > 0 ? (this.answeredCalls / this.totalCalls * 100).toFixed(2) : 0;
});

queueStatisticsSchema.virtual('abandonmentRate').get(function() {
  return this.totalCalls > 0 ? (this.abandonedCalls / this.totalCalls * 100).toFixed(2) : 0;
});

// Static methods for aggregation
queueStatisticsSchema.statics.getQueueSummary = async function(queueId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        queueId: queueId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: '$totalCalls' },
        answeredCalls: { $sum: '$answeredCalls' },
        abandonedCalls: { $sum: '$abandonedCalls' },
        avgWaitTime: { $avg: '$averageWaitTime' },
        avgTalkTime: { $avg: '$averageTalkTime' },
        maxWaitTime: { $max: '$longestWaitTime' },
        avgServiceLevel: { $avg: '$serviceLevelPercentage' }
      }
    }
  ]);
};

queueStatisticsSchema.statics.getHourlyTrends = async function(queueId, date) {
  const stats = await this.findOne({ queueId, date });
  return stats ? stats.hourlyStats : [];
};

queueStatisticsSchema.statics.getTopPerformingQueues = async function(startDate, endDate, limit = 10) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$queueId',
        queueName: { $first: '$queueName' },
        totalCalls: { $sum: '$totalCalls' },
        answeredCalls: { $sum: '$answeredCalls' },
        avgServiceLevel: { $avg: '$serviceLevelPercentage' },
        avgWaitTime: { $avg: '$averageWaitTime' }
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
        }
      }
    },
    { $sort: { answerRate: -1, avgServiceLevel: -1 } },
    { $limit: limit }
  ]);
};

const QueueStatistics = mongoose.model('QueueStatistics', queueStatisticsSchema);

module.exports = QueueStatistics;