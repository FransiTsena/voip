const fs = require('fs');
const path = require('path');
const asyncHandler = require('express-async-handler');
const CallLog = require('../models/callLog');

// GET /api/report/recordings
// Query params:
// - callerId, callee, from, to, hasRecording ('true'|'false')
// - page (number, default 1), pageSize (number, default 25)
// - sortBy (one of: startTime, duration, status, callerId, callee; default: startTime)
// - sortOrder ('asc'|'desc', default 'desc')
// - q (string; search across callerId, callerName, callee, calleeName, linkedId)
const listRecordings = asyncHandler(async (req, res) => {
    const { callerId, callee, from, to, hasRecording } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 25, 1), 200);
    const sortByRaw = (req.query.sortBy || 'startTime').toString();
    const sortOrderRaw = (req.query.sortOrder || 'desc').toString().toLowerCase();
    const q = (req.query.q || '').toString().trim();

    const allowedSortBy = new Set(['startTime', 'duration', 'status', 'callerId', 'callee']);
    const sortBy = allowedSortBy.has(sortByRaw) ? sortByRaw : 'startTime';
    const sortOrder = sortOrderRaw === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const andClauses = [];
    if (callerId) andClauses.push({ callerId });
    if (callee) andClauses.push({ callee });
    if (from || to) {
        const range = {};
        if (from) range.$gte = new Date(from);
        if (to) range.$lte = new Date(to);
        andClauses.push({ startTime: range });
    }
    if (hasRecording === 'true') andClauses.push({ recordingPath: { $exists: true, $ne: null } });
    if (hasRecording === 'false') andClauses.push({ $or: [{ recordingPath: { $exists: false } }, { recordingPath: null }] });

    if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        andClauses.push({
            $or: [
                { callerId: rx },
                { callerName: rx },
                { callee: rx },
                { calleeName: rx },
                { linkedId: rx },
            ],
        });
    }

    const filter = andClauses.length === 0 ? {} : (andClauses.length === 1 ? andClauses[0] : { $and: andClauses });

    const total = await CallLog.countDocuments(filter);

    const docs = await CallLog.find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('linkedId callerId callerName callee calleeName startTime endTime duration status recordingPath');

    const items = docs.map(d => ({
        id: d._id,
        linkedId: d.linkedId,
        callerId: d.callerId,
        callerName: d.callerName,
        callee: d.callee,
        calleeName: d.calleeName,
        startTime: d.startTime,
        endTime: d.endTime,
        duration: d.duration,
        status: d.status,
        hasRecording: Boolean(d.recordingPath),
    }));

    res.json({ page, pageSize, total, items });
});

// GET /api/report/recordings/:id/stream -> streams the audio if the file exists
const streamRecordingByCallLogId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const doc = await CallLog.findById(id).select('recordingPath');
    if (!doc) return res.status(404).json({ message: 'Call log not found' });
    if (!doc.recordingPath) return res.status(404).json({ message: 'No recording for this call' });

    const filePath = doc.recordingPath;
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Recording file not found' });

    const stat = fs.statSync(filePath);
    const range = req.headers.range;
    const mime = path.extname(filePath).toLowerCase() === '.wav' ? 'audio/wav' : 'audio/x-wav';

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunkSize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': mime,
        });
        file.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': stat.size,
            'Content-Type': mime,
        });
        fs.createReadStream(filePath).pipe(res);
    }
});

module.exports = { listRecordings, streamRecordingByCallLogId };
