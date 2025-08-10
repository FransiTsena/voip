const Ex = require("../../models/extension"); // Adjust path as necessary to your Mongoose model
const Agent = require("../../models/agent");
const bcrypt = require("bcryptjs");
const { reloadAsterisk } = require("../../utils/sudo");
const { generateAndWritePjsipConfigs } = require("./pjsipConfigGenerators"); // Import new utility
// const { generateAndWriteDialplan } = require('./utils/asteriskDialplanGenerator'); // Import dialplan utility

// @desc    Create a new PJSIP Extension
// @route   POST /api/extensions
// @access  Public (or adjust based on your auth strategy)
const createExtension = async (req, res) => {
  try {
    // Check if extension already exists
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

    var ext = req.body;

    const hashedPassword = await bcrypt.hash(req.body.secret, 10);
    ext["secret"] = hashedPassword;

    // Create a new extension instance with data from the request body
    const newExtension = new Ex(req.body);

    // Save the extension to the database
    const savedExtension = await newExtension.save();

    console.log(req.body.userExtension);
    console.log(req.body.secret);
    // If agent credentials are provided, create agent for authentication
    if (req.body.userExtension && req.body.secret) {
      const existingAgent = await Agent.findOne({
        username: req.body.userExtension,
      });
      console.log(existingAgent);
      if (existingAgent) {
        // Optionally update agent info, or skip creation
      } else {
        const agent = new Agent({
          username: req.body.userExtension,
          password: hashedPassword,
          name: req.body.displayName ?? "Agent " + req.body.userExtension,
          email: req.body.email || "",
        });
        await agent.save();
      }
    }

    // Fetch all extensions to regenerate PJSIP configs for all
    const allExtensions = await Ex.find({});

    // Generate and write PJSIP configuration files and reload PJSIP
    await generateAndWritePjsipConfigs(allExtensions);

    // Regenerate and write Asterisk dialplan (e.g., for IVR/Queue bindings to extensions)
    // await generateAndWriteDialplan();
    await reloadAsterisk();
    // Respond with the newly created extension and a success message
    return res.status(201).json({
      success: true,
      message:
        "Extension and agent created successfully. Asterisk configurations reloaded!",
      extension: savedExtension,
    });
  } catch (error) {
    console.error("Error creating extension or configuring Asterisk:", error);
    // Handle duplicate key errors specifically for unique fields (though we removed unique:true, good to keep for other unique fields)
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

// @desc    Get all PJSIP Extensions
// @route   GET /api/extensions
// @access  Public (or adjust based on your auth strategy)
const getAllExtensions = async (req, res) => {
  try {
    // Find all extensions in the database
    const extensions = await Ex.find({});

    // Respond with the list of extensions
    return res.status(200).json(extensions);
  } catch (error) {
    // Handle errors during retrieval
    return res.status(500).json({
      success: false,
      message: "Error retrieving extensions",
      error: error.message,
    });
  }
};

// @desc    Get a single PJSIP Extension by userExtension
// @route   GET /api/extensions/:userExtension
// @access  Public (or adjust based on your auth strategy)
const getExtensionByUserExtension = async (req, res) => {
  try {
    // Find an extension by its userExtension
    const extension = await Ex.findOne({
      userExtension: req.params.userExtension,
    });

    // If no extension is found, return 404 Not Found
    if (!extension) {
      return res.status(404).json({
        success: false,
        message: "Extension not found.",
      });
    }

    // Respond with the found extension
    return res.status(200).json({
      success: true,
      message: "Extension retrieved successfully!",
      extension: extension,
    });
  } catch (error) {
    // Handle errors during retrieval
    return res.status(500).json({
      success: false,
      message: "Error retrieving extension",
      error: error.message,
    });
  }
};

// @desc    Update a PJSIP Extension by userExtension
// @route   PUT /api/extensions/:userExtension
// @access  Public (or adjust based on your auth strategy)
const updateExtension = async (req, res) => {
  try {
    // Find the extension by userExtension and update it with the request body data
    // { new: true } returns the updated document
    // { runValidators: true } ensures schema validators are run on update
    const updatedExtension = await Ex.findOneAndUpdate(
      { userExtension: req.params.userExtension },
      req.body,
      { new: true, runValidators: true }
    );

    // If no extension is found, return 404 Not Found
    if (!updatedExtension) {
      return res.status(404).json({
        success: false,
        message: "Extension not found.",
      });
    }

    // Fetch all extensions to regenerate PJSIP configs for all (including the updated one)
    const allExtensions = await Ex.find({});
    await generateAndWritePjsipConfigs(allExtensions);

    // Regenerate and write Asterisk dialplan
    await generateAndWriteDialplan();

    // Respond with the updated extension
    return res.status(200).json({
      success: true,
      message:
        "Extension updated successfully and Asterisk configurations reloaded!",
      extension: updatedExtension,
    });
  } catch (error) {
    // Handle validation errors or other update errors
    console.error("Error updating extension or configuring Asterisk:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating extension: " + error.message,
      error: error.message,
    });
  }
};

const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Ex.findById(id);
    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "Agent not found" });
    }
    return res.status(200).json(agent);
  } catch (error) {
    console.error("Error fetching agent by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching agent",
      error: error.message,
    });
  }
};

module.exports = {
  createExtension,
  getAllExtensions,
  getExtensionByUserExtension,
  updateExtension,
  getAgentById,
  // deleteExtension (removed from here, will be in its own file)
};
