const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
    linkedId: { type: String, required: true, index: true },
    callerId: { type: String, required: true },
    callerName: { type: String },
    callee: { type: String }, // agent or destination
    calleeName: { type: String },
    dialString: { type: String },
    startTime: { type: Date, required: true },
    answerTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number }, // in seconds
    status: { type: String, enum: ['ringing', 'answered', 'missed', 'ended', 'busy', 'unanswered', 'failed', 'on_hold'], required: true },
    hangupCause: { type: String },
    channels: [{ type: String }],
    direction: { type: String, enum: ['inbound', 'outbound'] },
    queue: { type: String },
    queueName: { type: String },
    waitTime: { type: Number }, // time spent waiting in queue (seconds)
    holdTime: { type: Number }, // time spent on hold during call (seconds)
    ringTime: { type: Number }, // time spent ringing before answer (seconds)
    agentExtension: { type: String }, // extension of agent who handled the call
    agentName: { type: String }, // name of agent who handled the call
    transferCount: { type: Number, default: 0 }, // number of times call was transferred
    // Absolute path to the call recording on the server (set by AMI when MixMonitor starts)
    recordingPath: { type: String },
    extra: { type: mongoose.Schema.Types.Mixed }, // for any additional info
}, { timestamps: true });

module.exports = mongoose.model('CallLog', callLogSchema);
