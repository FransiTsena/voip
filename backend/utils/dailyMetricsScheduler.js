const cron = require('node-cron');
const User = require('../models/userModel');
const Queue = require('../models/queue');
const DailyPerformanceMetrics = require('../models/dailyPerformanceMetricsModel');
const { calculateAHT, calculateAbandonRate } = require('./metricsCalculator');

const calculateAndStoreDailyMetrics = async () => {
    console.log('Running daily metrics calculation job...');
    try {
        const today = new Date();
        today.setDate(today.getDate() - 1); // Calculate for yesterday
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const agents = await User.find({ role: 'agent' });
        for (const agent of agents) {
            const aht = await calculateAHT(agent._id);
            await DailyPerformanceMetrics.findOneAndUpdate(
                { date, agentId: agent._id },
                {
                    date,
                    agentId: agent._id,
                    metrics: {
                        averageHandleTime: aht
                    }
                },
                { upsert: true }
            );
        }

        const queues = await Queue.find();
        for (const queue of queues) {
            const abandonRate = await calculateAbandonRate(queue.queueId);
            await DailyPerformanceMetrics.findOneAndUpdate(
                { date, queueId: queue.queueId },
                {
                    date,
                    queueId: queue.queueId,
                    metrics: {
                        abandonRate: abandonRate
                    }
                },
                { upsert: true }
            );
        }

        console.log('Daily metrics calculation job finished.');
    } catch (error) {
        console.error('Error running daily metrics calculation job:', error);
    }
};

const scheduleDailyMetricsCalculation = () => {
    // Schedule to run at midnight every day
    cron.schedule('0 0 * * *', calculateAndStoreDailyMetrics);
};

module.exports = {
    scheduleDailyMetricsCalculation
};
