const { paperClasses } = require('@mui/material');
const mongoose = require('mongoose');

const supervisorSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: {type:String},
    email: {type:String},
    password: { type: String, required: true },
    // add other fields as needed
});

module.exports = mongoose.model('Supervisor', supervisorSchema);
