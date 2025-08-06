const Ticket = require('../models/ticketModel');
const CallLog = require('../models/callLog');
const Agent = require('../models/agent');
const asyncHandler = require('express-async-handler');

// @desc    Get agent metrics
// @route   GET /api/metrics/agent/:agentId
// @access  Private

const Shift = require('../models/shiftModel');

const getAgentMetrics = asyncHandler(async (req, res) => {
  const { agentId } = req.params;



  // Get today's date range
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // // Debug logging
  // console.log('Agent Metrics Debug:');
  // console.log('agentId:', agentId);
  // console.log('startOfDay:', startOfDay.toISOString());
  // console.log('endOfDay:', endOfDay.toISOString());
  const agent = await Agent.findById(agentId);

  // Tickets resolved today
  const ticketsResolved = await Ticket.countDocuments({
    agentId,
    status: 'Resolved',
    updatedAt: { $gte: startOfDay, $lt: endOfDay },
  });

  // Calls handled today
  const callsHandled = await CallLog.countDocuments({
    $or: [
      { callee: agent.username || agentId },
      { callerId: agent.username || agentId }
    ],
    startTime: { $gte: startOfDay, $lt: endOfDay },
  });

  // Total calls today (all statuses)
  const totalCalls = await CallLog.countDocuments({
    $or: [
      { callee: agent.username || agentId },
      { callerId: agent.username || agentId }
    ],
    startTime: { $gte: startOfDay, $lt: endOfDay },
  });

  // Missed calls today
  const missedCalls = await CallLog.countDocuments({
    $or: [
      { callee: agent.username || agentId },
      { callerId: agent.username || agentId }
    ],
    status: 'missed',
    startTime: { $gte: startOfDay, $lt: endOfDay },
  });

  // Average call duration today (for answered calls)
  const avgDurationAgg = await CallLog.aggregate([
    {
      $match: {
        $or: [
          { callee: agent.username || agentId },
          { callerId: agent.username || agentId }
        ],
        status: 'answered',
        startTime: { $gte: startOfDay, $lt: endOfDay },
        duration: { $exists: true, $ne: null }
      }
    },
    { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
  ]);
  const avgDuration = avgDurationAgg[0]?.avgDuration || 0;

  // Online duration and time (sum of shift durations for today)
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
      // Ongoing shift: add up to now
      onlineDuration += (Date.now() - new Date(shift.startTime).getTime()) / 1000;
    }
    // Count number of shifts as onlineTime (sessions)
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

// @desc    Get agent shift report
// @route   GET /api/metrics/agent/:agentId/shifts
// @access  Private
const getAgentShiftReport = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  // Fetch agent details
  const agent = await Agent.findById(agentId).select('name username email');
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const shifts = await Shift.find({ agentId }).sort({ startTime: -1 });
  if (!shifts || shifts.length === 0) {
    return res.json({ agentId, agent, shifts: [], totalShifts: 0, totalDuration: 0 });
  }
  // Format shift data for report
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
