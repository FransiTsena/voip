const Ticket = require('../models/ticketModel');
const CallLog = require('../models/callLog');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const Shift = require('../models/shiftModel');

const getAgentMetrics = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const agent = await User.findById(agentId);
  if (!agent || agent.role !== 'agent') {
    res.status(404);
    throw new Error('Agent not found');
  }

  const ticketsResolved = await Ticket.countDocuments({
    agentId,
    status: 'Resolved',
    updatedAt: { $gte: startOfDay, $lt: endOfDay },
  });

  const callsHandled = await CallLog.countDocuments({
    $or: [
      { callee: agent.userExtension },
      { callerId: agent.userExtension }
    ],
    startTime: { $gte: startOfDay, $lt: endOfDay },
  });

  const totalCalls = await CallLog.countDocuments({
    $or: [
      { callee: agent.userExtension },
      { callerId: agent.userExtension }
    ],
    startTime: { $gte: startOfDay, $lt: endOfDay },
  });

  const missedCalls = await CallLog.countDocuments({
    $or: [
      { callee: agent.userExtension },
      { callerId: agent.userExtension }
    ],
    status: 'missed',
    startTime: { $gte: startOfDay, $lt: endOfDay },
  });

  const avgDurationAgg = await CallLog.aggregate([
    {
      $match: {
        $or: [
          { callee: agent.userExtension },
          { callerId: agent.userExtension }
        ],
        status: 'answered',
        startTime: { $gte: startOfDay, $lt: endOfDay },
        duration: { $exists: true, $ne: null }
      }
    },
    { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
  ]);
  const avgDuration = avgDurationAgg[0]?.avgDuration || 0;

  const shifts = await Shift.find({
    agentId,
    startTime: { $gte: startOfDay, $lt: endOfDay },
  });
  let onlineDuration = 0;
  let onlineTime = 0;
  shifts.forEach(shift => {
    if (shift.duration) {
      onlineDuration += shift.duration;
    } else if (shift.startTime && !shift.endTime) {
      onlineDuration += (Date.now() - new Date(shift.startTime).getTime()) / 1000;
    }
    onlineTime += 1;
  });

  res.json({
    ticketsResolved,
    callsHandled,
    totalCalls,
    missedCalls,
    avgDuration,
    onlineDuration,
    onlineTime,
  });
});

const getAgentShiftReport = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const agent = await User.findById(agentId).select('displayName email userExtension');
  if (!agent || agent.role !== 'agent') {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const shifts = await Shift.find({ agentId }).sort({ startTime: -1 });
  if (!shifts || shifts.length === 0) {
    return res.json({ agentId, agent, shifts: [], totalShifts: 0, totalDuration: 0 });
  }
  let totalDuration = 0;
  const report = shifts.map(shift => {
    const start = shift.startTime ? new Date(shift.startTime) : null;
    const end = shift.endTime ? new Date(shift.endTime) : null;
    let duration = shift.duration;
    if (!duration) {
      if (end && start) {
        duration = (end - start) / 1000;
      } else if (start && !end) {
        duration = (Date.now() - start.getTime()) / 1000;
      } else {
        duration = 0;
      }
    }
    totalDuration += duration;
    return {
      startTime: start ? start.toISOString() : null,
      endTime: end ? end.toISOString() : null,
      duration,
      ongoing: !shift.endTime,
    };
  });
  res.json({
    agentId,
    agent,
    shifts: report,
    totalShifts: report.length,
    totalDuration,
  });
});

module.exports = {
  getAgentMetrics,
  getAgentShiftReport,
};
