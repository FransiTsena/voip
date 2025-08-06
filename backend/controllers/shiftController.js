const Shift = require('../models/shiftModel');
const asyncHandler = require('express-async-handler');

// @desc    Start a new shift
// @route   POST /api/shifts/start
// @access  Private
const startShift = asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  if (!agentId) {
    res.status(400);
    throw new Error('Agent ID is required');
  }

  const shift = new Shift({
    agentId,
    startTime: new Date(),
  });

  const createdShift = await shift.save();
  res.status(201).json(createdShift);
});

// @desc    End a shift
// @route   POST /api/shifts/end
// @access  Private
const endShift = asyncHandler(async (req, res) => {
  const { shiftId } = req.body;

  if (!shiftId) {
    res.status(400);
    throw new Error('Shift ID is required');
  }

  const shift = await Shift.findById(shiftId);

  if (shift) {
    shift.endTime = new Date();
    shift.duration = (shift.endTime - shift.startTime) / 1000; // in seconds
    const updatedShift = await shift.save();
    res.json(updatedShift);
  } else {
    res.status(404);
    throw new Error('Shift not found');
  }
});

// @desc    Get all shifts for an agent
// @route   GET /api/shifts/agent/:agentId
// @access  Private
const getAgentShifts = asyncHandler(async (req, res) => {
  const shifts = await Shift.find({ agentId: req.params.agentId });
  res.json(shifts);
});

// @desc    Update reason for a shift
// @route   PUT /api/shifts/:shiftId/reason
// @access  Private
const updateShiftReason = asyncHandler(async (req, res) => {
  const { shiftId } = req.params;
  const { reason } = req.body;
  if (!reason || typeof reason !== 'string') {
    return res.status(400).json({ error: 'Reason is required' });
  }
  const shift = await Shift.findByIdAndUpdate(
    shiftId,
    { reason },
    { new: true }
  );
  if (!shift) {
    return res.status(404).json({ error: 'Shift not found' });
  }
  res.json({ success: true, reason: shift.reason, shift });
});

module.exports = {
  startShift,
  endShift,
  getAgentShifts,
  updateShiftReason,
};
