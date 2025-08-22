const mongoose = require('mongoose');

const dailyPerformanceMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  queueId: {
    type: String,
  },
  metrics: {
    totalCalls: { type: Number, default: 0 },
    answeredCalls: { type: Number, default: 0 },
    missedCalls: { type: Number, default: 0 },
    abandonedCalls: { type: Number, default: 0 },
    averageHandleTime: { type: Number, default: 0 },
    firstCallResolution: { type: Number, default: 0 },
    averageWaitTime: { type: Number, default: 0 },
    serviceLevel: { type: Number, default: 0 },
  },
}, { timestamps: true });

dailyPerformanceMetricsSchema.index({ date: 1, agentId: 1, queueId: 1 }, { unique: true });

const DailyPerformanceMetrics = mongoose.model('DailyPerformanceMetrics', dailyPerformanceMetricsSchema);

module.exports = DailyPerformanceMetrics;
