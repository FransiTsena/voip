const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
    name: String,
    email: String,
    // add other fields as needed
});

module.exports = mongoose.model('Agent', agentSchema);
