const User = require('../models/userModel');
const AgentProfile = require('../models/agentProfileModel');
const asyncHandler = require('express-async-handler');

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        if (user.role === 'agent') {
            const agentProfile = await AgentProfile.findOne({ user: user._id });
            res.json({ ...user.toObject(), profile: agentProfile });
        } else {
            res.json(user);
        }
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.displayName = req.body.displayName || user.displayName;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;

        if (req.body.password) {
            user.password = req.body.password;
        }

        if (user.role === 'agent') {
            user.userExtension = req.body.userExtension || user.userExtension;
            const agentProfile = await AgentProfile.findOne({ user: user._id });
            if (agentProfile) {
                agentProfile.queues = req.body.queues || agentProfile.queues;
                await agentProfile.save();
            }
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            displayName: updatedUser.displayName,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = { getUserById, updateUser };
