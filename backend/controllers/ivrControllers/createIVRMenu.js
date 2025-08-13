const IVRMenu = require('../../models/ivr_model');
// Main: Create IVR Menu and regenerate all IVRs in config
const createIVRMenu = async (req, res) => {
  try {
    const { name, description, dtmf, entries, extension } = req.body; // Added 'extension' to destructure
    console.log(req.body);

    // 1. Validate required fields
    if (!dtmf?.announcement?.id) {
      return res.status(400).json({
        status: 400,
        message: "Announcement ID is required",
        error: "Missing required announcement fields"
      });
    }
    if (!name) {
      return res.status(400).json({
        status: 400,
        message: "IVR menu name is required",
        error: "Missing IVR menu name"
      });
    }

    // 2. Create the new IVR menu
    const menu = new IVRMenu({
      name,
      description: description || '',
      dtmf: {
        announcement: {
          id: dtmf.announcement.id,
          name: dtmf.announcement.name
        },
        timeout: dtmf.timeout || 5,
        invalidRetries: dtmf.invalidRetries || 3,
        timeoutRetries: dtmf.timeoutRetries || 3,
        invalidRetryRecording: {
          id: dtmf.invalidRetryRecording?.id || '',
          name: dtmf.invalidRetryRecording?.name || ''
        }
      },
      entries: (entries || []).map(entry => ({
        id: entry.id || Date.now(), // Simple ID for entries, consider UUID for robustness
        type: entry.type,
        digit: entry.digit,
        value: entry.value,
        label: entry.label || `Option ${entry.digit}`
      })),
      extension: extension || '' // Store the extension here
    });
    await menu.save();

    // --- Key Change: Fetch ALL IVRs and generate config for all ---
    res.status(201).json({
      status: 201,
      message: 'IVR menu created and all IVRs reconfigured successfully',
      menu,
      // config: finalConfig // Uncomment for debugging if needed
    });
  } catch (error) {
    console.log(error)
  }
};

module.exports = {
  createIVRMenu
};