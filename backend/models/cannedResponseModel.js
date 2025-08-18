const mongoose = require('mongoose');

const cannedResponseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    trim: true,
  },
  keywords: [{
    type: String,
    trim: true,
  }],
}, { timestamps: true });

const CannedResponse = mongoose.model('CannedResponse', cannedResponseSchema);

module.exports = CannedResponse;
