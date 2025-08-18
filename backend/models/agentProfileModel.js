const mongoose = require('mongoose');

const agentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  queues: [{ type: String }],
  totalCallsToday: { type: Number, default: 0 },
  answeredCallsToday: { type: Number, default: 0 },
  missedCallsToday: { type: Number, default: 0 },
  averageTalkTimeToday: { type: Number, default: 0 },
  averageWrapTimeToday: { type: Number, default: 0 },
  averageHoldTimeToday: { type: Number, default: 0 },
  averageRingTimeToday: { type: Number, default: 0 },
  longestIdleTimeToday: { type: Number, default: 0 },
  totalCallsOverall: { type: Number, default: 0 },
  answeredCallsOverall: { type: Number, default: 0 },
  missedCallsOverall: { type: Number, default: 0 },
  averageTalkTimeOverall: { type: Number, default: 0 },
  averageWrapTimeOverall: { type: Number, default: 0 },
  averageHoldTimeOverall: { type: Number, default: 0 },
  averageRingTimeOverall: { type: Number, default: 0 },
  longestIdleTimeOverall: { type: Number, default: 0 },
}, { timestamps: true });

const AgentProfile = mongoose.model('AgentProfile', agentProfileSchema);

module.exports = AgentProfile;
