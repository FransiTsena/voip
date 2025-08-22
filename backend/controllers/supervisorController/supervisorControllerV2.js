// TODO: This is a temporary file to work around a file modification issue.
// Once the issue is resolved, this file should be merged with supervisorController.js and this file should be deleted.

const User = require('../../models/userModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all supervisors
// @route   GET /api/supervisors
// @access  Private (Admin)
const getAllSupervisors = asyncHandler(async (req, res) => {
    const supervisors = await User.find({ role: 'supervisor' }).select('-password');
    res.json(supervisors);
});

// @desc    Get supervisor by ID
// @route   GET /api/supervisors/:id
// @access  Private (Admin)
const getSupervisorById = asyncHandler(async (req, res) => {
    const supervisor = await User.findOne({ _id: req.params.id, role: 'supervisor' }).select('-password');
    if (supervisor) {
        res.json(supervisor);
    } else {
        res.status(404);
        throw new Error('Supervisor not found');
    }
});

// @desc    Update supervisor
// @route   PUT /api/supervisors/:id
// @access  Private (Admin)
const updateSupervisor = asyncHandler(async (req, res) => {
    const supervisor = await User.findById(req.params.id);

    if (supervisor && supervisor.role === 'supervisor') {
        supervisor.displayName = req.body.displayName || supervisor.displayName;
        supervisor.email = req.body.email || supervisor.email;

        if (req.body.password) {
            supervisor.password = req.body.password;
        }

        const updatedSupervisor = await supervisor.save();

        res.json({
            _id: updatedSupervisor._id,
            displayName: updatedSupervisor.displayName,
            email: updatedSupervisor.email,
            role: updatedSupervisor.role,
        });
    } else {
        res.status(404);
        throw new Error('Supervisor not found');
    }
});

// @desc    Delete supervisor
// @route   DELETE /api/supervisors/:id
// @access  Private (Admin)
const deleteSupervisor = asyncHandler(async (req, res) => {
    const supervisor = await User.findById(req.params.id);

    if (supervisor && supervisor.role === 'supervisor') {
        await supervisor.deleteOne();
        res.json({ message: 'Supervisor removed' });
    } else {
        res.status(404);
        throw new Error('Supervisor not found');
    }
});

module.exports = {
    getAllSupervisors,
    getSupervisorById,
    updateSupervisor,
    deleteSupervisor,
};
