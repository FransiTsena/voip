const Ex = require('../../models/extension'); // Adjust path as necessary to your Mongoose model
const { reloadAsterisk } = require('../../utils/sudo');
const { generateAndWritePjsipConfigs } = require('./pjsipConfigGenerators'); // Import PJSIP config utility
// const { generateAndWriteDialplan } = require('./asteriskDialplanGenerator'); // Import dialplan utility

// @desc    Delete a PJSIP Extension by userExtension
// @route   DELETE /api/extensions/:userExtension
// @access  Public (or adjust based on your auth strategy)
const deleteExtension = async (req, res) => {
    const extensionId = req.params.extensionId; // Assuming the extension ID is passed in the URL
  try {
    // Find and delete the extension by userExtension
    // Assuming req.params.userExtension is used for identification
    const deletedExtension = await Ex.findByIdAndDelete(extensionId);

    // If no extension is found, return 404 Not Found
    if (!deletedExtension) {
      return res.status(404).json({
        success: false,
        message: 'Extension not found in database.'
      });
    }

    // Fetch all remaining extensions to regenerate PJSIP configs for all
    const allExtensions = await Ex.find({});
    await generateAndWritePjsipConfigs(allExtensions);

    // Regenerate and write Asterisk dialplan (to remove any bindings to the deleted extension)
    // await generateAndWriteDialplan();
    await reloadAsterisk();

    // Respond with a success message
    return res.status(200).json({
      success: true,
      message: `Extension ${deletedExtension.userExtension} deleted successfully and Asterisk configurations reloaded!`,
      extension: deletedExtension // Optionally return the deleted document
    });
  } catch (error) {
    console.error('Error deleting extension or configuring Asterisk:', error);
    // Handle errors during deletion
    return res.status(500).json({
      success: false,
      message: 'Error deleting extension: ' + error.message,
      error: error.message
    });
  }
};

module.exports = {
  deleteExtension
};
