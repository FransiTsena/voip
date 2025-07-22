const { writeFileWithSudo } = require('../../utils/sudo'); // Assuming sudo.js is in utils
const util = require('util');
const { exec } = require('child_process');
const mongoose = require('mongoose'); // Import mongoose to use isValid for ObjectId checks
const IVRMenu = require('../../models/ivr_model');
const audioRecording = require('../../models/audioRecording');
const Queue = require('../../models/queue');
const Extension = require('../../models/extension');
const MiscApplication = require('../../models/miscApplicationModel'); // Import the new MiscApplication model

const execPromise = util.promisify(exec);

// Helper to get recording filename(s) from recording ID
// This helper is crucial for both IVRs and Misc Applications if they use recordings
const getRecordingFilenamesArray = (recordingId, allRecordings) => {
  if (!recordingId || !allRecordings) {
    return [];
  }
  let idToCompare = mongoose.Types.ObjectId.isValid(recordingId) ? recordingId.toString() : recordingId;
  const rec = allRecordings.find(r => r._id.toString() === idToCompare);
  if (!rec || !rec.audioFiles || rec.audioFiles.length === 0) {
    return [];
  }
  // Ensure the path is relative to the Asterisk sounds directory, typically 'custom'
  return rec.audioFiles
    .map(file => `custom/${file.originalName.split('/').pop().replace(/\.\w+$/, '')}`)
    .filter(name => name !== 'custom/'); // Filter out empty or invalid names
};


// Helper to generate Asterisk dialplan for IVR menus
const generateIvrDialplan = (allIVRs, allRecordings) => {
  console.log("Generating IVR Dialplan...");

  let ivrConfigSections = ''; // For [ivr_ID] contexts
  let ivrBindings = '';       // For exten => in [from-internal-custom]

  // Helper to get destination goto string based on type for IVR entries
  // This helper is for IVR internal logic, not Misc Apps
  const getDestinationGoto = (destinationValue, currentIvrId) => {
    if (!destinationValue || destinationValue === 'None' || destinationValue === 'Hangup') {
      return 'Hangup()';
    }
    if (destinationValue === 'Return to IVR') {
      return `Goto(ivr_${currentIvrId},s,1)`;
    }
    // Check if it's an IVR ID (e.g., 'ivr_654321...')
    if (destinationValue.startsWith('ivr_')) {
      const targetIvrId = destinationValue.substring(4);
      return `Goto(ivr_${targetIvrId},s,1)`;
    }
    // Check if it's a Queue ID (e.g., 'queue_1001')
    if (destinationValue.startsWith('queue_')) {
      const targetQueueId = destinationValue.substring(6);
      return `Queue(${targetQueueId})`;
    }
    // Default to a direct extension in from-internal context
    return `Goto(from-internal,${destinationValue},1)`;
  };

  allIVRs.forEach(menu => {
    const safeId = menu._id.toString();
    const dtmf = menu.dtmf || {};

    ivrConfigSections += `\n[ivr_${safeId}]\n`;
    ivrConfigSections += `exten => s,1,NoOp(IVR Menu: ${menu.name} - ID: ${safeId})\n`;
    ivrConfigSections += `same => n,Answer()\n`;
    ivrConfigSections += `same => n,Set(TIMEOUT(digit)=${dtmf.timeout || 5})\n`;
    ivrConfigSections += `same => n,Set(TIMEOUT(response)=10)\n`;

    if (dtmf.enableDirectDial === 'Enabled') {
      ivrConfigSections += `exten => _X.,1,NoOp(Direct Dial: \${EXTEN})\n`;
      ivrConfigSections += `same => n,Goto(from-internal,\${EXTEN},1)\n`;
    }

    const announcementFilenames = getRecordingFilenamesArray(dtmf.announcement?.id, allRecordings);
    if (announcementFilenames.length > 0) {
      announcementFilenames.forEach(filename => {
        ivrConfigSections += `same => n,Background(${filename})\n`;
      });
    }

    if (dtmf.alertInfo && dtmf.alertInfo !== 'None') {
        ivrConfigSections += `same => n,Set(SIPADDHEADER=Alert-Info: ${dtmf.alertInfo})\n`;
    }
    if (dtmf.ringerVolumeOverride) {
        ivrConfigSections += `same => n,Set(CHANNEL(ringer_volume)=${dtmf.ringerVolumeOverride})\n`;
    }

    let waitExtenOptions = dtmf.ignoreTrailingHash === 'Yes' ? 'h' : '';
    ivrConfigSections += `same => n,WaitExten(10${waitExtenOptions ? `,${waitExtenOptions}` : ''})\n`;

    menu.entries.forEach(entry => {
      ivrConfigSections += `\nexten => ${entry.digit},1,NoOp(Option ${entry.digit} - ${entry.label || entry.type})\n`;
      switch (entry.type) {
        case 'extension': ivrConfigSections += `same => n,Dial(PJSIP/${entry.value},30)\n`; break;
        case 'queue': ivrConfigSections += `same => n,Queue(${entry.value})\n`; break;
        case 'ivr': ivrConfigSections += `same => n,Goto(ivr_${entry.value},s,1)\n`; break;
        case 'voicemail':
          ivrConfigSections += `same => n,VoiceMail(${entry.value}@default)\n`;
          if (dtmf.returnToIvrAfterVm === 'Yes') {
            ivrConfigSections += `same => n,Goto(ivr_${safeId},s,1)\n`;
          }
          break;
        case 'recording':
          const entryRecordingFilenames = getRecordingFilenamesArray(entry.value, allRecordings);
          if (entryRecordingFilenames.length > 0) {
            entryRecordingFilenames.forEach(filename => ivrConfigSections += `same => n,Playback(${filename})\n`);
          }
          break;
        case 'hangup': ivrConfigSections += `same => n,Hangup()\n`; break;
        default: ivrConfigSections += `same => n,Playback(invalid)\n`;
      }
      // Ensure calls hang up after action unless it's a specific IVR or voicemail return
      if (entry.type !== 'ivr' && entry.type !== 'recording' && !(entry.type === 'voicemail' && dtmf.returnToIvrAfterVm === 'Yes')) {
          ivrConfigSections += `same => n,Hangup()\n`;
      }
    });

    ivrConfigSections += `\nexten => i,1,NoOp(Invalid option for IVR: ${menu.name})\n`;
    if (dtmf.appendAnnouncementToInvalid === 'Yes' && announcementFilenames.length > 0) {
      announcementFilenames.forEach(filename => ivrConfigSections += `same => n,Background(${filename})\n`);
    }
    const invalidRecFilenames = getRecordingFilenamesArray(dtmf.invalidRecording?.id, allRecordings);
    if (invalidRecFilenames.length > 0) {
        invalidRecFilenames.forEach(filename => ivrConfigSections += `same => n,Playback(${filename})\n`);
    } else {
        ivrConfigSections += `same => n,Playback(invalid)\n`;
    }
    ivrConfigSections += `same => n,${getDestinationGoto(dtmf.invalidDestination, safeId)}\n`;
    if (dtmf.returnOnInvalid === 'Yes' && (dtmf.invalidDestination === 'None' || dtmf.invalidDestination === 'Hangup')) {
        ivrConfigSections += `same => n,Goto(ivr_${safeId},s,1)\n`;
    }

    ivrConfigSections += `\nexten => t,1,NoOp(Timeout for IVR: ${menu.name})\n`;
    if (dtmf.appendAnnouncementOnTimeout === 'Yes' && announcementFilenames.length > 0) {
      announcementFilenames.forEach(filename => ivrConfigSections += `same => n,Background(${filename})\n`);
    }
    const timeoutRecFilenames = getRecordingFilenamesArray(dtmf.timeoutRecording?.id, allRecordings);
    if (timeoutRecFilenames.length > 0) {
        timeoutRecFilenames.forEach(filename => ivrConfigSections += `same => n,Playback(${filename})\n`);
    } else {
        ivrConfigSections += `same => n,Playback(vm-timeout)\n`;
    }
    ivrConfigSections += `same => n,${getDestinationGoto(dtmf.timeoutDestination, safeId)}\n`;
    if (dtmf.returnOnTimeout === 'Yes' && (dtmf.timeoutDestination === 'None' || dtmf.timeoutDestination === 'Hangup')) {
        ivrConfigSections += `same => n,Goto(ivr_${safeId},s,1)\n`;
    }

    if (menu.extension) {
        ivrBindings += `exten => ${menu.extension},1,Goto(ivr_${safeId},s,1)\n`;
    }
  });
  return { ivrConfigSections, ivrBindings };
};

// Helper to generate Asterisk dialplan for Queue bindings
const generateQueueDialplan = (allQueues) => {
    let queueBindings = '';
    allQueues.forEach(queue => {
        queueBindings += `exten => ${queue.queueId},1,NoOp(Route to Queue: ${queue.name} - ID: ${queue.queueId})\n`;
        queueBindings += `same => n,Queue(${queue.queueId})\n`;
        queueBindings += `same => n,Hangup()\n`;
    });
    return queueBindings;
};

// Helper to generate Asterisk dialplan for Agent extensions
const generateAgentDialplan = (allAgents) => {
    let agentBindings = '';
    allAgents.forEach(agent => {
      if (agent.userExtension) {
        agentBindings += `exten => ${agent.userExtension},1,NoOp(Dialing Agent: ${agent.displayName || agent.userExtension})\n`;
        agentBindings += `same => n,Dial(PJSIP/${agent.userExtension},30)\n`;
        agentBindings += `same => n,Hangup()\n`;
      }
    });
    return agentBindings;
};

// MODIFIED: Helper to generate Asterisk dialplan for Miscellaneous Applications from the database
const generateMiscApplicationDialplan = (allMiscApps, allRecordings) => {
  console.log(allMiscApps);
  console.log(allMiscApps);
  console.log(allMiscApps);
  console.log(allMiscApps);
    let miscAppBindings = '';
    allMiscApps.forEach(app => {
        const destinationType = app.destination.type;
        const destinationId = app.destination.id;
        let asteriskAction = '';

        switch (destinationType) {
            case 'extension':
                asteriskAction = `Dial(PJSIP/${destinationId},30)`;
                break;
            case 'queue':
                asteriskAction = `Queue(${destinationId})`;
                break;
            case 'ivr':
                asteriskAction = `Goto(ivr_${destinationId},s,1)`;
                break;
            case 'recording':
                const recordingFilenames = getRecordingFilenamesArray(destinationId, allRecordings);
                if (recordingFilenames.length > 0) {
                    // Play all associated recording files
                    asteriskAction = recordingFilenames.map(filename => `Playback(${filename})`).join('\nsame => n,');
                } else {
                    asteriskAction = `NoOp(Recording ID ${destinationId} not found or has no files)`;
                }
                break;
            default:
                asteriskAction = `NoOp(Unknown destination type: ${destinationType} for Misc App: ${app.name})`;
                break;
        }

        miscAppBindings += `\n; Feature Code: ${app.name} (${destinationType}: ${destinationId})\n`;
        miscAppBindings += `exten => ${app.featureCode},1,NoOp(Executing Misc App: ${app.name})\n`;
        miscAppBindings += `same => n,Answer()\n`; // Answering is good practice before executing an app
        miscAppBindings += `same => n,${asteriskAction}\n`; // The dynamically generated action
        miscAppBindings += `same => n,Hangup()\n`; // Hangup after the action
    });
    return miscAppBindings;
};

// Main function to generate and write the combined dialplan
const generateAndWriteDialplan = async () => {
    try {
        // Fetch all necessary data from the database
        const allIVRs = await IVRMenu.find({});
        const allRecordings = await audioRecording.find({});
        const allQueues = await Queue.find({});
        const allExtensions = await Extension.find({});
        const allMiscApps = await MiscApplication.find({}); // Fetch all misc applications

        let combinedDialplan = '[from-internal-custom]\n';

        // Generate dialplan for each section
        // Pass allRecordings to generateIvrDialplan as well
        const { ivrConfigSections, ivrBindings } = generateIvrDialplan(allIVRs, allRecordings);
        const agentBindings = generateAgentDialplan(allExtensions);
        const queueBindings = generateQueueDialplan(allQueues);
        // MODIFIED: Pass allRecordings to generateMiscApplicationDialplan
        const miscAppBindings = generateMiscApplicationDialplan(allMiscApps, allRecordings);

        // Header
        combinedDialplan += ';*******************************************************************************\n';
        combinedDialplan += '; AUTO-GENERATED DIALPLAN By INSA-PBX - DO NOT EDIT MANUALLY                             *\n';
        combinedDialplan += ';*******************************************************************************\n';

        // Add IVR section
        if (ivrBindings.trim().length > 0 || ivrConfigSections.trim().length > 0) {
            combinedDialplan += '\n; --- IVR (Interactive Voice Response) Menus ---\n';
            combinedDialplan += ivrBindings.trim() + '\n';
            combinedDialplan += ivrConfigSections.trim() + '\n';
        }

        // Add Agent (Extension) section
        if (agentBindings.trim().length > 0) {
            combinedDialplan += '\n; --- Agent (Extension) Dialplan ---\n';
            combinedDialplan += agentBindings.trim() + '\n';
        }

        // Add Queue section
        if (queueBindings.trim().length > 0) {
            combinedDialplan += '\n; --- Queue Dialplan ---\n';
            combinedDialplan += queueBindings.trim() + '\n';
        }

        // Add Misc Application section
        if (miscAppBindings.trim().length > 0) {
          combinedDialplan += '\n; --- Miscellaneous Applications (Feature Codes) ---\n';
          combinedDialplan += '\n[from-internal]\n';
            combinedDialplan += miscAppBindings.trim() + '\n';
        }

        const configPath = '/etc/asterisk/extensions_custom.conf';

        // Write the combined configuration to the file
        await writeFileWithSudo(configPath, combinedDialplan.trim());
        console.log('extensions_custom.conf regenerated successfully.');

        // Reload Asterisk dialplan
        await execPromise('sudo asterisk -rx "dialplan reload"');
        console.log('Asterisk dialplan reloaded successfully.');

    } catch (error) {
        console.error('Error generating and writing dialplan:', error);
        throw error;
    }
};

module.exports = { generateAndWriteDialplan };