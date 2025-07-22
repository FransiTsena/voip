const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const AudioRecording = require('../../models/audioRecording');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

ffmpeg.setFfmpegPath(ffmpegPath);

// Configure storage for audio files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const audioDir = path.join(__dirname, '../../audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    cb(null, audioDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `upload-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

// File filter to allow only audio files
// Update the file filter to handle MP3 MIME types more flexibly
const fileFilter = (req, file, cb) => {
  const filetypes = /wav|mp3|gsm|m4a|ogg|aac/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.match(/audio\/.+/); // More lenient MIME type check for audio files

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(new Error('Only audio files are allowed (WAV, MP3, GSM, M4A, OGG, AAC)'));
};

// Initialize multer with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 400 * 1024 * 1024 } // 20MB limit per file
}).array('audioFiles', 100);

// Function to convert audio to Asterisk-compatible WAV format
const convertToAsteriskWav = (inputPath) => {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(/\.\w+$/, '') + '-converted.wav';

    ffmpeg()
      .input(inputPath)
      .audioFrequency(8000)
      .audioChannels(1)
      .audioCodec('pcm_s16le')
      .outputOptions([
        '-ar 8000',
        '-ac 1',
        '-y'
      ])
      .output(outputPath)
      .on('end', () => {
        // Delete the original file
        fs.unlink(inputPath, (err) => {
          if (err) console.error('Error deleting original file:', err);

          // Get file stats for the converted file
          fs.stat(outputPath, (err, stats) => {
            if (err) return reject(err);

            // Rename the converted file to the original name (without -converted)
            const finalPath = outputPath.replace('-converted.wav', '.wav');
            fs.rename(outputPath, finalPath, (err) => {
              if (err) return reject(err);
              resolve({
                path: finalPath,
                size: stats.size
              });
            });
          });
        });
      })
      .on('error', (err) => {
        console.error('Error converting file:', err);
        // Clean up any partial files
        [inputPath, outputPath].forEach(file => {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        });
        reject(err);
      })
      .run();
  });
};

// Function to move file to Asterisk directory with sudo, using original filename
const moveToAsteriskDir = async (sourcePath, originalName) => {
  try {
    const asteriskDir = '/var/lib/asterisk/sounds/en/custom';

    // Get the original filename without extension and add .wav
    const originalBaseName = path.basename(originalName, path.extname(originalName));
    const targetFileName = `${originalBaseName}.wav`;
    const targetPath = path.join(asteriskDir, targetFileName);

    // Ensure the target directory exists
    await execPromise(`sudo mkdir -p "${asteriskDir}"`);

    // Move the file using sudo
    await execPromise(`sudo mv "${sourcePath}" "${targetPath}"`);

    // Set appropriate permissions
    await execPromise(`sudo chown asterisk:asterisk "${targetPath}"`);
    await execPromise(`sudo chmod 644 "${targetPath}"`);

    return targetPath;
  } catch (error) {
    console.error('Error moving file to Asterisk directory:', error);
    throw error;
  }
};

// Controller function to handle audio upload
const uploadAudio = async (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files were uploaded.'
        });
      }

      const { name, description } = req.body;

      if (!name) {
        // Clean up any uploaded files if validation fails
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        return res.status(400).json({
          success: false,
          message: 'Recording name is required.'
        });
      }

      const audioFiles = [];

      // Process each file
      for (const file of req.files) {
        try {
          // Convert to Asterisk-compatible WAV
          const { path: filePath, size } = await convertToAsteriskWav(file.path);

          // Move to Asterisk directory with original filename but with .wav extension
          const asteriskPath = await moveToAsteriskDir(filePath, file.originalname);
          const fileName = path.basename(asteriskPath);

          // Create a new filename with .wav extension
          const baseName = path.basename(file.originalname, path.extname(file.originalname));
          const newFileName = `${baseName}.wav`;

          audioFiles.push({
            originalName: newFileName,  // Use the new .wav extension
            filePath: asteriskPath,  // Full server path for backend reference
            size: size,
            mimeType: 'audio/wav',
            // Update URL to point to the Asterisk directory with .wav extension
            url: `/sounds/en/custom/${newFileName}`,  // Web-accessible URL with .wav extension
            order: audioFiles.length
          });

        } catch (fileError) {
          console.error('Error processing file:', file.originalname, fileError);
          // Clean up the file if processing fails
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          throw new Error(`Failed to process file: ${file.originalname}`);
        }
      }

      // Save to database
      const recording = new AudioRecording({
        name,
        description: description || '',
        audioFiles
      });

      await recording.save();

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Files uploaded and processed successfully',
        data: {
          id: recording._id,
          name: recording.name,
          description: recording.description,
          audioFiles: recording.audioFiles.map(file => ({
            id: file._id,
            originalName: file.originalName,
            url: file.url,
            size: file.size,
            order: file.order
          }))
        }
      });

    } catch (error) {
      console.error('Error in uploadAudio:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while processing your request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

module.exports = uploadAudio;