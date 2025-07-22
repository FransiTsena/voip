// IVR Menu Schema
const mongoose = require('mongoose');

const ivrMenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dtmf: {
    announcement: {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    },
    timeout: {
      type: Number,
      default: 5
    },
    invalidRetries: {
      type: Number,
      default: 3
    },
    timeoutRetries: {
      type: Number,
      default: 3
    },
    invalidRetryRecording: {
      id: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      }
    }
  },
  entries: [{
    id: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    digit: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Create indexes for better query performance
ivrMenuSchema.index({ name: 1 }); 
ivrMenuSchema.index({ 'entries.digit': 1 });

const IVRMenu = mongoose.model('IVRMenu', ivrMenuSchema);

module.exports = IVRMenu;