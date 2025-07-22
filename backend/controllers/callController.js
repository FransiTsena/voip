const { ami } = require('../index');
const asyncHandler = require('express-async-handler');

// @desc    Hold a call
// @route   POST /api/call/hold
// @access  Private
const holdCall = asyncHandler(async (req, res) => {
  const { channel } = req.body;

  if (!channel) {
    res.status(400);
    throw new Error('Channel is required');
  }

  const action = {
    action: 'Hold',
    channel,
  };

  ami.action(action, (err, amiResponse) => {
    if (err) {
      res.status(500);
      throw new Error(err);
    }
    res.json(amiResponse);
  });
});

// @desc    Unhold a call
// @route   POST /api/call/unhold
// @access  Private
const unholdCall = asyncHandler(async (req, res) => {
  const { channel } = req.body;

  if (!channel) {
    res.status(400);
    throw new Error('Channel is required');
  }

  const action = {
    action: 'Unhold',
    channel,
  };

  ami.action(action, (err, amiResponse) => {
    if (err) {
      res.status(500);
      throw new Error(err);
    }
    res.json(amiResponse);
  });
});

// @desc    Mute a call
// @route   POST /api/call/mute
// @access  Private
const muteCall = asyncHandler(async (req, res) => {
  const { channel } = req.body;

  if (!channel) {
    res.status(400);
    throw new Error('Channel is required');
  }

  const action = {
    action: 'MuteAudio',
    channel,
    direction: 'all',
    state: 'on',
  };

  ami.action(action, (err, amiResponse) => {
    if (err) {
      res.status(500);
      throw new Error(err);
    }
    res.json(amiResponse);
  });
});

// @desc    Unmute a call
// @route   POST /api/call/unmute
// @access  Private
const unmuteCall = asyncHandler(async (req, res) => {
  const { channel } = req.body;

  if (!channel) {
    res.status(400);
    throw new Error('Channel is required');
  }

  const action = {
    action: 'MuteAudio',
    channel,
    direction: 'all',
    state: 'off',
  };

  ami.action(action, (err, amiResponse) => {
    if (err) {
      res.status(500);
      throw new Error(err);
    }
    res.json(amiResponse);
  });
});


// @desc    Transfer a call
// @route   POST /api/call/transfer
// @access  Private
const transferCall = asyncHandler(async (req, res) => {
  const { channel, exten, context } = req.body;

  if (!channel || !exten || !context) {
    res.status(400);
    throw new Error('Channel, extension, and context are required');
  }

  const action = {
    action: 'Redirect',
    channel,
    exten,
    context,
    priority: 1,
  };

  ami.action(action, (err, amiResponse) => {
    if (err) {
      res.status(500);
      throw new Error(err);
    }
    res.json(amiResponse);
  });
});

// @desc    End a call
// @route   POST /api/call/end
// @access  Private
const endCall = asyncHandler(async (req, res) => {
  const { channel } = req.body;

  if (!channel) {
    res.status(400);
    throw new Error('Channel is required');
  }

  const action = {
    action: 'Hangup',
    channel,
  };

  ami.action(action, (err, amiResponse) => {
    if (err) {
      res.status(500);
      throw new Error(err);
    }
    res.json(amiResponse);
  });
});

module.exports = {
  holdCall,
  unholdCall,
  muteCall,
  unmuteCall,
  transferCall,
  endCall,
};
