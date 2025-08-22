const Ex = require("../models/extension");
const { reloadAsterisk } = require("../utils/sudo");
const { generateAndWritePjsipConfigs } = require("./agentControllers/pjsipConfigGenerators");

const createExtension = async (req, res) => {
  try {
    const existing = await Ex.findOne({
      userExtension: req.body.userExtension,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "Extension number already exists. Please choose a different one.",
      });
    }

    const newExtension = new Ex(req.body);
    const savedExtension = await newExtension.save();

    const allExtensions = await Ex.find({});
    await generateAndWritePjsipConfigs(allExtensions);
    await reloadAsterisk();

    return res.status(201).json({
      success: true,
      message:
        "Extension created successfully. Asterisk configurations reloaded!",
      extension: savedExtension,
    });
  } catch (error) {
    console.error("Error creating extension or configuring Asterisk:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: "A record with this unique identifier already exists.",
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message:
        "Error creating extension or configuring Asterisk: " + error.message,
      error: error.message,
    });
  }
};

const getAllExtensions = async (req, res) => {
  try {
    const extensions = await Ex.find({});
    return res.status(200).json(extensions);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving extensions",
      error: error.message,
    });
  }
};

const getExtensionByUserExtension = async (req, res) => {
  try {
    const extension = await Ex.findOne({
      userExtension: req.params.userExtension,
    });
    if (!extension) {
      return res.status(404).json({
        success: false,
        message: "Extension not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Extension retrieved successfully!",
      extension: extension,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving extension",
      error: error.message,
    });
  }
};

const updateExtension = async (req, res) => {
  try {
    const updatedExtension = await Ex.findOneAndUpdate(
      { userExtension: req.params.userExtension },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedExtension) {
      return res.status(404).json({
        success: false,
        message: "Extension not found.",
      });
    }
    const allExtensions = await Ex.find({});
    await generateAndWritePjsipConfigs(allExtensions);
    await reloadAsterisk();
    return res.status(200).json({
      success: true,
      message:
        "Extension updated successfully and Asterisk configurations reloaded!",
      extension: updatedExtension,
    });
  } catch (error) {
    console.error("Error updating extension or configuring Asterisk:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating extension: " + error.message,
      error: error.message,
    });
  }
};

module.exports = {
  createExtension,
  getAllExtensions,
  getExtensionByUserExtension,
  updateExtension,
};
