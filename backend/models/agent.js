const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // extension
    password: { type: String, required: true }, // hashed
    name: { type: String },
    email: { type: String },

    // --- Live status snapshot ---
    // status: removed for real-time only
    // deviceState: removed for real-time only

    queues: [{ type: String }], // queue memberships

    // --- Daily stats (reset at midnight) ---
    totalCallsToday: { type: Number, default: 0 },
    answeredCallsToday: { type: Number, default: 0 }, // Queue calls answered
    missedCallsToday: { type: Number, default: 0 },
    averageTalkTimeToday: { type: Number, default: 0 }, // seconds
    averageWrapTimeToday: { type: Number, default: 0 }, // seconds
    averageHoldTimeToday: { type: Number, default: 0 }, // seconds - caller wait time
    averageRingTimeToday: { type: Number, default: 0 }, // seconds - agent ring time
    longestIdleTimeToday: { type: Number, default: 0 }, // seconds

    // --- Overall stats (never reset) ---
    totalCallsOverall: { type: Number, default: 0 },
    answeredCallsOverall: { type: Number, default: 0 }, // Queue calls answered
    missedCallsOverall: { type: Number, default: 0 },
    averageTalkTimeOverall: { type: Number, default: 0 }, // seconds
    averageWrapTimeOverall: { type: Number, default: 0 }, // seconds
    averageHoldTimeOverall: { type: Number, default: 0 }, // seconds - caller wait time
    averageRingTimeOverall: { type: Number, default: 0 }, // seconds - agent ring time
    longestIdleTimeOverall: { type: Number, default: 0 } // seconds
}, {
    timestamps: true
});

module.exports = mongoose.model('Agent', agentSchema);
