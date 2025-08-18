const { calculateFCR, calculateAHT, calculateAbandonRate } = require('../utils/metricsCalculator');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Queue = require('../models/queue');
const Ticket = require('../models/ticketModel');

// @desc    Get FCR, AHT, and Abandon Rate for all agents and queues
// @route   GET /api/metrics/advanced
// @access  Private (Admin, Supervisor)
const getAdvancedMetrics = asyncHandler(async (req, res) => {
    const agents = await User.find({ role: 'agent' });
    const queues = await Queue.find();

    const agentMetrics = await Promise.all(agents.map(async (agent) => {
        const aht = await calculateAHT(agent._id);
        // FCR is customer-based, so we can't calculate it per agent without more context.
        // We can calculate a general FCR for all customers.
        return {
            agentId: agent._id,
            displayName: agent.displayName,
            averageHandleTime: aht.toFixed(2),
        };
    }));

    const queueMetrics = await Promise.all(queues.map(async (queue) => {
        const abandonRate = await calculateAbandonRate(queue.queueId);
        return {
            queueId: queue.queueId,
            name: queue.name,
            abandonRate: abandonRate.toFixed(2),
        };
    }));

    const customers = await Ticket.distinct('customerId');
    const fcrPromises = customers.map(customerId => calculateFCR(customerId));
    const fcrResults = await Promise.all(fcrPromises);
    const totalFcr = fcrResults.reduce((acc, curr) => acc + curr, 0);
    const averageFcr = fcrResults.length > 0 ? totalFcr / fcrResults.length : 0;

    res.json({
        firstCallResolution: averageFcr.toFixed(2),
        agents: agentMetrics,
        queues: queueMetrics,
    });
});

module.exports = {
    getAdvancedMetrics
};
