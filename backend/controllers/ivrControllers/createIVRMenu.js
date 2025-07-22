const IVRMenu = require('../../models/ivr_model');
const AudioRecording = require('../../models/audioRecording');
const { exec } = require('child_process');
const util = require('util');
const { writeFileWithSudo } = require('../../utils/sudo');
const execPromise = util.promisify(exec);

// Helper: Generate Asterisk config for one IVR
const generateAsteriskConfig = (menu, originalNamesAnnouncement, originalNamesInvalidRetryRecording) => {
  const safeId = menu._id.toString(); // Use _id for a unique and safe name in Asterisk context
  let config = `\n[ivr_${safeId}]\n`;
  config += `exten => s,1,NoOp(IVR Menu: ${menu.name} - ID: ${safeId})\n`; // Added menu.name for clarity in logs
  config += ` same => n,Answer()\n`;
  config += ` same => n,Set(TIMEOUT(digit)=${menu.dtmf.timeout})\n`;
  config += ` same => n,Set(TIMEOUT(response)=10)\n`;

  // Add all announcement audio files
  originalNamesAnnouncement.forEach(audioUrl => {
    const fileName = audioUrl.split('/').pop().replace(/\.\w+$/, '');
    config += ` same => n,Background(custom/${fileName})\n`;
  });

  // Add menu prompt
  config += ` same => n,WaitExten(10)\n`; // Reduced initial beep, directly to WaitExten

  // Process each menu entry
  menu.entries.forEach(entry => {
    config += `\nexten => ${entry.digit},1,NoOp(Option ${entry.digit} - ${entry.label || entry.type})\n`; // Use label if available

    switch (entry.type) {
      case 'extension':
        config += ` same => n,Dial(PJSIP/${entry.value},30)\n`;
        break;
      case 'queue':
        config += ` same => n,Goto(ext-queues,${entry.value},1)\n`; // Assuming 'ext-queues' is your FreePBX queue context
        break;
      case 'ivr':
        // Ensure the target IVR's ID is used for the Goto
        const targetIvrId = entry.value; // Assuming entry.value for IVR type is the target IVR's _id
        config += ` same => n,Goto(ivr_${targetIvrId},s,1)\n`;
        break;
      case 'voicemail':
        config += ` same => n,VoiceMail(${entry.value}@default)\n`; // Assuming 'default' voicemail context
        break;
      case 'recording':
        // Assuming entry.value for 'recording' is the filename (without path or extension)
        config += ` same => n,Background(custom/${entry.value})\n`;
        break;
      case 'hangup': // Added a hangup option
        config += ` same => n,Hangup()\n`;
        break;
      default:
        config += ` same => n,Playback(invalid)\n`; // Fallback for unhandled types
    }

    // Hangup only if the action doesn't inherently transfer control (like IVR or Recording which might loop/return)
    if (entry.type !== 'ivr' && entry.type !== 'recording') {
      config += ` same => n,Hangup()\n`;
    }
  });

  // Dynamic invalid option handler
  config += `\nexten => i,1,NoOp(Invalid option selected for IVR: ${menu.name})\n`;
  if (originalNamesInvalidRetryRecording && originalNamesInvalidRetryRecording.length > 0) {
    originalNamesInvalidRetryRecording.forEach(audioUrl => {
      const fileName = audioUrl.split('/').pop().replace(/\.\w+$/, '');
      config += ` same => n,Playback(custom/${fileName})\n`;
    });
  } else {
    config += ` same => n,Playback(invalid)\n`; // Default invalid prompt if none is specified
  }
  config += ` same => n,Goto(ivr_${safeId},s,1)\n`; // Loop back to the start of the current IVR

  // Timeout handler
  config += `\nexten => t,1,NoOp(Timeout for IVR: ${menu.name})\n`;
  config += ` same => n,Playback(vm-timeout)\n`; // More standard timeout message
  config += ` same => n,Goto(ivr_${safeId},s,1)\n`; // Loop back to the start of the current IVR

  return config;
};

// Helper: Generate extension binding for one IVR
// This helper is now simpler, as the binding will be collected centrally.
const generateExtensionBinding = (menu) => {
  // Only generate a binding if the menu has a specific extension assigned
  if (menu.extension) {
    // Use menu._id to point to the correct IVR context
    return `exten => ${menu.extension},1,Goto(ivr_${menu._id.toString()},s,1)\n`;
  }
  return ''; // No binding if no extension
};

// Helper: Reload Asterisk
const reloadAsterisk = async () => {
  try {
    // Use 'core reload' for a full reload, or 'dialplan reload' for just dialplan changes
    await execPromise('sudo asterisk -rx "dialplan reload"'); // More targeted reload
    console.log('Asterisk dialplan reloaded successfully');
  } catch (error) {
    console.error('Error reloading Asterisk dialplan:', error);
    throw error;
  }
};

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

    // 3. Fetch all IVR menus from the database
    // const allIVRs = await IVRMenu.find({});

    let combinedAsteriskConfig = '';
    let combinedExtensionBindings = '[from-internal]\n'; // Start a common context for extensions

    for (const ivr of allIVRs) {
      // Fetch announcement and invalid retry recordings for each IVR
      const announcementRecording = await AudioRecording.findById(ivr.dtmf.announcement.id);
      const originalNamesAnnouncement = (announcementRecording?.audioFiles || []).map(file => file.originalName);

      let originalNamesInvalidRetryRecording = [];
      if (ivr.dtmf.invalidRetryRecording?.id) {
        const invalidRetryRecording = await AudioRecording.findById(ivr.dtmf.invalidRetryRecording.id);
        originalNamesInvalidRetryRecording = (invalidRetryRecording?.audioFiles || []).map(file => file.originalName);
      }

      // Generate config for the current IVR
      combinedAsteriskConfig += generateAsteriskConfig(ivr, originalNamesAnnouncement, originalNamesInvalidRetryRecording);

      // Generate extension binding for the current IVR if it has one
      combinedExtensionBindings += generateExtensionBinding(ivr);
      combinedExtensionBindings += 'exten => _XXXX,1,Dial(PJSIP/${EXTEN})\n same => n,Hangup()\n';
      combinedExtensionBindings += '\n[ext-queues]\nexten => _XXXX,1,Answer()\n same => n,Queue(${EXTEN})\n same => n,Hangup()\n';

    }

    // // Final combined configuration
    // const finalConfig = combinedAsteriskConfig + '\n' + combinedExtensionBindings;


    // 4. Write the combined config to file and reload Asterisk
    res.status(201).json({
      status: 201,
      message: 'IVR menu created and all IVRs reconfigured successfully',
      menu,
      // config: finalConfig // Uncomment for debugging if needed
    });
    // const configPath = '/etc/asterisk/extensions_custom.conf';
    // try {
    //   await writeFileWithSudo(configPath, finalConfig);
    //   await reloadAsterisk(); // Changed to reloadAsterisk for clarity

    //   r
    // } catch (error) {
    //   console.error('Error saving Asterisk configuration or reloading:', error);
    //   // If config save fails, delete the menu we just created to prevent inconsistencies
    //   await IVRMenu.findByIdAndDelete(menu._id);

    //   res.status(500).json({
    //     status: 500,
    //     error: 'Failed to save Asterisk configuration or reload Asterisk',
    //     details: error.message
    //   });
    // }
  } catch (error) {
    console.error('Error creating IVR menu:', error);
    res.status(500).json({
      status: 500,
      error: 'Failed to create IVR menu',
      details: error.message
    });
  }
};

module.exports = {
  createIVRMenu
};