const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // in seconds
  },
  reason: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const Shift = mongoose.model('Shift', shiftSchema);

module.exports = Shift;
