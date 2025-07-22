const Ticket = require('../models/ticketModel');
const CallLog = require('../models/callLog');
const asyncHandler = require('express-async-handler');

// @desc    Get agent metrics
// @route   GET /api/metrics/agent/:agentId
// @access  Private
const getAgentMetrics = asyncHandler(async (req, res) => {
  const { agentId } = req.params;

  const ticketsResolved = await Ticket.countDocuments({
    agentId,
    status: 'Resolved',
  });

  const callsHandled = await CallLog.countDocuments({ agentId });

  // Add more metrics as needed

  res.json({
    ticketsResolved,
    callsHandled,
  });
});

module.exports = {
  getAgentMetrics,
};
