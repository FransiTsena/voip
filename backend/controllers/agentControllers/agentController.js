const User = require('../../models/userModel');
const AgentProfile = require('../../models/agentProfileModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all agents
// @route   GET /api/agents
// @access  Private (Admin, Supervisor)
const getAllAgents = asyncHandler(async (req, res) => {
    const agents = await User.find({ role: 'agent' }).select('-password');
    res.json(agents);
});

// @desc    Get agent by ID
// @route   GET /api/agents/:id
// @access  Private (Admin, Supervisor)
const getAgentById = asyncHandler(async (req, res) => {
    const agent = await User.findOne({ _id: req.params.id, role: 'agent' }).select('-password');
    if (agent) {
        const agentProfile = await AgentProfile.findOne({ user: agent._id });
        res.json({ ...agent.toObject(), profile: agentProfile });
    } else {
        res.status(404);
        throw new Error('Agent not found');
    }
});

// @desc    Update agent
// @route   PUT /api/agents/:id
// @access  Private (Admin, Supervisor)
const updateAgent = asyncHandler(async (req, res) => {
    const agent = await User.findById(req.params.id);

    if (agent && agent.role === 'agent') {
        agent.displayName = req.body.displayName || agent.displayName;
        agent.email = req.body.email || agent.email;
        agent.userExtension = req.body.userExtension || agent.userExtension;

        if (req.body.password) {
            agent.password = req.body.password;
        }

        const updatedAgent = await agent.save();

        const agentProfile = await AgentProfile.findOne({ user: updatedAgent._id });
        if (agentProfile) {
            agentProfile.queues = req.body.queues || agentProfile.queues;
            await agentProfile.save();
        }

        res.json({
            _id: updatedAgent._id,
            displayName: updatedAgent.displayName,
            email: updatedAgent.email,
            role: updatedAgent.role,
            userExtension: updatedAgent.userExtension,
        });
    } else {
        res.status(404);
        throw new Error('Agent not found');
    }
});

// @desc    Delete agent
// @route   DELETE /api/agents/:id
// @access  Private (Admin)
const deleteAgent = asyncHandler(async (req, res) => {
    const agent = await User.findById(req.params.id);

    if (agent && agent.role === 'agent') {
        await AgentProfile.findOneAndDelete({ user: agent._id });
        await agent.deleteOne();
        res.json({ message: 'Agent removed' });
    } else {
        res.status(404);
        throw new Error('Agent not found');
    }
});

module.exports = {
    getAllAgents,
    getAgentById,
    updateAgent,
    deleteAgent,
};
