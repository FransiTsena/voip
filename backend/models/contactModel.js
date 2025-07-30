const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true,
    },
});

module.exports = mongoose.model('Contact', contactSchema);
