const Shift = require('../models/shiftModel');
const Agent = require('../models/agent');
const asyncHandler = require('express-async-handler');

// @desc    Get today's agent shifts only
// @route   GET /api/metrics/agent/:agentId/shifts/today
// @access  Private
const getAgentTodayShifts = asyncHandler(async (req, res) => {
    const { agentId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const agent = await Agent.findById(agentId).select('name username email');
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const query = {
        agentId,
        startTime: { $gte: startOfDay, $lt: endOfDay },
    };
    const totalShifts = await Shift.countDocuments(query);
    const shifts = await Shift.find(query)
        .sort({ startTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
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
            _id: shift._id,
            startTime: start ? start.toISOString() : null,
            endTime: end ? end.toISOString() : null,
            duration,
            ongoing: !shift.endTime,
            reason: shift.reason || '',
        };
    });
    res.json({
        agentId,
        agent,
        shifts: report,
        totalShifts,
        totalDuration,
        page,
        limit,
        totalPages: Math.ceil(totalShifts / limit),
    });
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
    // Use findByIdAndUpdate to ensure DB update
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
    getAgentTodayShifts,
    updateShiftReason,
};
