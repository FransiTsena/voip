const mongoose = require('mongoose');


const queueSchema = new mongoose.Schema({
  queueId: { type: String, required: true, unique: true }, // e.g., 300
  name: { type: String, required: true }, // e.g., "Support Queue"
  description: { type: String, default: '' }, // e.g., "Queue for support calls"
  announceFrequency: { type: Number, default: 0 },
  announceHoldtime: { type: String, default: 'no' },
  announcePosition: { type: String, default: 'no' },
  autofill: { type: String, default: 'no' },
  autopause: { type: String, default: 'no' },
  autopausebusy: { type: String, default: 'no' },
  autopausedelay: { type: Number, default: 0 },
  autopauseunavail: { type: String, default: 'no' },
  joinempty: { type: String, default: 'yes' },
  leavewhenempty: { type: String, default: 'no' },
  maxlen: { type: Number, default: 0 },
  memberdelay: { type: Number, default: 0 },
  minAnnounceFrequency: { type: Number, default: 15 },
  penaltymemberslimit: { type: Number, default: 0 },
  periodicAnnounceFrequency: { type: Number, default: 0 },
  queueCallsWaiting: { type: String, default: 'silence/1' },
  queueThereAre: { type: String, default: 'silence/1' },
  queueYouAreNext: { type: String, default: 'silence/1' },
  reportholdtime: { type: String, default: 'no' },
  retry: { type: Number, default: 5 },
  ringinuse: { type: String, default: 'yes' },
  servicelevel: { type: Number, default: 60 },
  strategy: { type: String, default: 'ringall' },
  timeout: { type: Number, default: 15 },
  timeoutpriority: { type: String, default: 'app' },
  timeoutrestart: { type: String, default: 'no' },
  weight: { type: Number, default: 0 },
  wrapuptime: { type: Number, default: 0 },
  context: { type: String, default: '' },
  members: {
    type: [String], // Array of member extensions, e.g., ["1001", "1002"]
    default: []
  }, // Default to an empty array
  generalSettings: {
    type: Object,
    required: true,
    default: {},
  },
  queueAgents: {
    type: [Object], // Changed back to [Object] as per your request
    default: [],
  },
  timingAgentOptions: {
    type: Object,
    default: {},
  },
  capacityOptions: {
    type: Object,
    default: {},
  },
}, { timestamps: true }); // Add createdAt and updatedAt timestamps

const Queue = mongoose.model('Queue', queueSchema);

module.exports = Queue;
