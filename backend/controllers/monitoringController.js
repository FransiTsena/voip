const asyncHandler = require('express-async-handler');

// @desc    Initiate a monitoring session (listen, whisper, barge)
// @route   POST /api/monitoring/initiate
// @access  Private (Supervisor, Admin)
const initiateMonitoring = asyncHandler(async (req, res) => {
    const { targetExtension, mode } = req.body;
    const supervisorExtension = req.user.userExtension;

    if (!targetExtension || !mode || !supervisorExtension) {
        res.status(400);
        throw new Error('Missing required parameters');
    }

    let featureCode = '556'; // Default to listen
    if (mode === 'whisper') {
        featureCode = '557';
    } else if (mode === 'barge') {
        featureCode = '558';
    }

    const action = {
        Action: 'Originate',
        Channel: `PJSIP/${supervisorExtension}`,
        Context: 'from-internal',
        Exten: `${featureCode}${targetExtension}`,
        Priority: 1,
        CallerID: `Spy <${supervisorExtension}>`,
    };

    global.ami.action(action, (err, amiResponse) => {
        if (err) {
            console.error('AMI Error:', err);
            res.status(500).json({ message: 'Failed to initiate monitoring' });
        } else {
            res.json({ message: 'Monitoring initiated successfully', data: amiResponse });
        }
    });
});

module.exports = {
    initiateMonitoring,
};
