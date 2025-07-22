const { exec } = require('child_process');
const util = require('util');
const { writeFileWithSudo } = require('../../utils/sudo');
const miscApplicationModel = require('../../models/miscApplicationModel'); // Assuming this model exists and is correct
const execPromise = util.promisify(exec);

// Helper: Generate extension binding for one Misc Application
const generateExtensionBinding = (featureCode, menuId) => {
  if (featureCode) {
    return `exten => ${featureCode},1,Goto(ivr_${menuId.toString()},s,1)\n`;
  }
  return '';
};

// Helper: Reload Asterisk dialplan
const reloadAsterisk = async () => {
  try {
    await execPromise('sudo asterisk -rx "dialplan reload"');
    console.log('Asterisk dialplan reloaded successfully');
  } catch (error) {
    console.error('Error reloading Asterisk dialplan:', error);
    throw error;
  }
};

// Helper: Regenerate the entire extensions_override_freepbx.conf file
const regenerateMiscAppConfig = async () => {
  const allMiscApplications = await miscApplicationModel.find({});
  let combinedExtensionBindings = '[from-internal]\n';

  for (const app of allMiscApplications) {
    combinedExtensionBindings += generateExtensionBinding(app.featureCode, app.destination);
  }

  combinedExtensionBindings += 'exten => _XXXX,1,Dial(PJSIP/${EXTEN})\n same => n,Hangup()\n';
  combinedExtensionBindings += '\n[ext-queues]\nexten => _XXXX,1,Answer()\n same => n,Queue(${EXTEN})\n same => n,Hangup()\n';
  const finalConfig = combinedExtensionBindings;
  const configPath = '/etc/asterisk/extensions_override_freepbx.conf';

  await writeFileWithSudo(configPath, finalConfig);
  await reloadAsterisk();
};

// Controller: Create Misc Application
const createMiscApplication = async (req, res) => {
  try {
    const { name, featureCode, destination } = req.body;

    // 1. Validate required fields
    if (!featureCode) {
      return res.status(400).json({
        status: 400,
        message: "Feature Code is required",
        error: "Missing required featureCode"
      });
    }
    if (!name) {
      return res.status(400).json({
        status: 400,
        message: "Misc Application name is required",
        error: "Missing Misc Application name"
      });
    }
    if (!destination) {
      return res.status(400).json({
        status: 400,
        message: "Destination (IVR ID) is required",
        error: "Missing destination IVR ID"
      });
    }

    // 2. Create the new Misc Application
    const miscApplication = new miscApplicationModel({
      name,
      featureCode,
      destination
    });
    await miscApplication.save();

    // 3. Regenerate the config file with all applications
    // await regenerateMiscAppConfig();

    res.status(201).json({
      status: 201,
      message: 'Misc Application created successfully and config reloaded',
      miscApplication,
    });
  } catch (error) {
    console.error('Error creating MiscApplication:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(409).json({
        status: 409,
        error: `Duplicate entry: A Misc Application with ${field} '${value}' already exists.`,
        details: error.message
      });
    }
    res.status(500).json({
      status: 500,
      error: 'Failed to create MiscApplication',
      details: error.message
    });
  }
};

// Controller: Get All Misc Applications
const getAllMiscApplications = async (req, res) => {
  try {
    const miscApplications = await miscApplicationModel.find({});
    res.json({ success: true, count: miscApplications.length, data: miscApplications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Controller: Delete Misc Application
const deleteMiscApplication = async (req, res) => {
  try {
    const { id } = req.params; // Get ID from URL parameters

    const deletedApp = await miscApplicationModel.findByIdAndDelete(id);

    if (!deletedApp) {
      return res.status(404).json({
        status: 404,
        message: 'Misc Application not found',
        error: 'No application found with the provided ID'
      });
    }

    // After deletion, regenerate the config file with the remaining applications
    await regenerateMiscAppConfig();

    res.status(200).json({
      status: 200,
      message: 'Misc Application deleted successfully and config reloaded',
      deletedApp,
    });

  } catch (error) {
    console.error('Error deleting Misc Application:', error);
    res.status(500).json({
      status: 500,
      error: 'Failed to delete Misc Application',
      details: error.message
    });
  }
};

module.exports = {
  createMiscApplication,
  getAllMiscApplications,
  deleteMiscApplication // Export the new delete function
};
