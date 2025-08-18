const CallLog = require('../models/callLog');
const Ticket = require('../models/ticketModel');

const calculateFCR = async (customerId) => {
    // FCR Calculation
    const fcrAggregation = await Ticket.aggregate([
        {
            $match: {
                status: 'Resolved',
                callLogId: { $ne: null },
                customerId: customerId
            }
        },
        {
            $lookup: {
                from: 'calllogs',
                localField: 'callLogId',
                foreignField: '_id',
                as: 'callLog'
            }
        },
        {
            $unwind: '$callLog'
        },
        {
            $group: {
                _id: '$customerId',
                firstCall: { $min: '$callLog.startTime' },
                resolvedTickets: { $sum: 1 }
            }
        },
        {
            $match: {
                resolvedTickets: 1
            }
        },
        {
            $count: 'fcrTickets'
        }
    ]);

    const totalResolvedTickets = await Ticket.countDocuments({ status: 'Resolved', customerId: customerId });
    const fcr = totalResolvedTickets > 0 ? (fcrAggregation[0]?.fcrTickets || 0) / totalResolvedTickets * 100 : 0;
    return fcr;
};

const calculateAHT = async (agentId) => {
    // AHT Calculation
    const ahtAggregation = await CallLog.aggregate([
        {
            $match: {
                status: 'answered',
                agentId: agentId
            }
        },
        {
            $group: {
                _id: null,
                avgDuration: { $avg: '$duration' }
            }
        }
    ]);
    const aht = ahtAggregation[0]?.avgDuration || 0;
    return aht;
};

const calculateAbandonRate = async (queueId) => {
    // Abandon Rate Calculation
    const totalCalls = await CallLog.countDocuments({ queue: queueId });
    const abandonedCalls = await CallLog.countDocuments({ queue: queueId, status: 'abandoned' });
    const abandonRate = totalCalls > 0 ? abandonedCalls / totalCalls * 100 : 0;
    return abandonRate;
};

module.exports = {
    calculateFCR,
    calculateAHT,
    calculateAbandonRate
};
