const mongoose = require('mongoose');

const audioRecordingSchema = new mongoose.Schema({
  // Basic information
  name: {
    type: String,
    required: [true, 'Recording name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Array of audio files
  audioFiles: [{
    // Original name of the file (e.g., "welcome-message.wav")
    originalName: {
      type: String,
      required: true
    },
    
    // Path where the file is stored on the server
    filePath: {
      type: String,
      required: true
    },
    
    // Size in bytes
    size: {
      type: Number,
      required: true
    },
    
    // MIME type (e.g., "audio/wav")
    mimeType: {
      type: String,
      required: true
    },
    
    // Public URL to access the file
    url: {
      type: String,
      required: true
    },
    
    // Order in the sequence (if multiple files)
    order: {
      type: Number,
      default: 0
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
audioRecordingSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('AudioRecording', audioRecordingSchema);
