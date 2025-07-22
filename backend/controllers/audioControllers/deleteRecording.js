// server/controllers/audio-controllers/deleteRecording.js
const AudioRecording = require('../../models/audioRecording');

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const deleteRecording = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the recording in the database
    const recording = await AudioRecording.findById(id);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }

    // 2. Delete the audio files from the file system
    const audioDir = '/var/lib/asterisk/sounds/en/custom';
    
    // Delete each audio file
    for (const file of recording.audioFiles) {
      const filePath = path.join(audioDir, file.originalName);
      
      // Check if file exists before trying to delete
      if (fs.existsSync(filePath)) {
        // Use sudo to delete the file
        try {
          await execAsync(`sudo rm -f "${filePath}"`);
          console.log(`Deleted file: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting file ${filePath}:`, err);
          // Continue with database deletion even if file deletion fails
        }
      }
    }

    // 3. Delete the recording from the database
    await AudioRecording.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Recording and associated files deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting recording',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteAudioFile = async (req, res) => {
  try {
    const { recordingId, fileId } = req.params;
    const { fileName } = req.body;

    // 1. Find the recording in the database
    const recording = await AudioRecording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }

    // 2. Find the specific file to delete
    const fileToDelete = recording.audioFiles.find(file => file._id.toString() === fileId);
    if (!fileToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Audio file not found in recording'
      });
    }

    // 3. Delete the audio file from the file system
    const audioDir = '/var/lib/asterisk/sounds/en/custom';
    const filePath = path.join(audioDir, fileName || fileToDelete.originalName);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    } catch (fsError) {
      console.error('Error deleting audio file from filesystem:', fsError);
      // Continue with database operation even if file deletion fails
    }

    // 4. Remove the file from the audioFiles array
    recording.audioFiles = recording.audioFiles.filter(file => file._id.toString() !== fileId);
    
    // 5. If this was the last file, delete the entire recording
    if (recording.audioFiles.length === 0) {
      await AudioRecording.findByIdAndDelete(recordingId);
      return res.status(200).json({
        success: true,
        message: 'Last audio file deleted, recording removed',
        deletedRecording: true
      });
    }

    // 6. Save the updated recording
    await recording.save();

    res.status(200).json({
      success: true,
      message: 'Audio file deleted successfully',
      updatedRecording: recording
    });

  } catch (error) {
    console.error('Error deleting audio file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting audio file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  deleteRecording,
  deleteAudioFile
};