const AudioRecording = require('../../models/audioRecording');

// Get all recordings
const getRecordings = async (req, res) => {
  try {
    const recordings = await AudioRecording.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: recordings.length,
      data: recordings
    });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recordings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single recording by ID
const getRecordingById = async (req, res) => {
  try {
    const recording = await AudioRecording.findById(req.params.id);
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: recording
    });
  } catch (error) {
    console.error('Error fetching recording:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recording',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getRecordings,
  getRecordingById
};
