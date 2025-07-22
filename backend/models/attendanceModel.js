const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
    agentId: {
        type: Schema.Types.ObjectId,
        ref: 'Agent',
        required: true
    },
    shiftId: {
        type: Schema.Types.ObjectId,
        ref: 'Shift',
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late'],
        default: 'absent'
    },
    checkInTime: {
        type: Date
    },
    checkOutTime: {
        type: Date
    }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
