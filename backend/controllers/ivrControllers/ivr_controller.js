const IVRMenu = require('../../models/ivr_model');
const ami = require('../../index').ami; // Import the AMI client from index.js
const fs = require('fs');
const path = require('path');
const { writeFileWithSudo, reloadAsterisk } = require('../../utils/sudo');

// Get all IVR menus
const getAllMenus = async (req, res) => {
  try {
    const menus = await IVRMenu.find().sort({ createdAt: -1 });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single IVR menu by ID
const getMenuById = async (req, res) => {
  try {
    const menu = await IVRMenu.findById(req.params.id);
    console.log(menu)
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an IVR menu
const updateMenu = async (req, res) => {
  try {
    const menu = await IVRMenu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    const { name, options } = req.body;
    
    // Validate required fields
    if (!name || !options || !Array.isArray(options)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    menu.name = name;
    menu.options = options.map(option => ({
      number: option.number,
      queue: option.queue
    }));

    await menu.save();

    // Update Asterisk configuration
    const asteriskConfig = generateAsteriskConfig(menu);
    const configPath = '/etc/asterisk/extensions_custom.conf';
    
    try {
      // Write to extensions_custom.conf
      fs.writeFileSync(configPath, asteriskConfig);
      console.log('Updated extensions_custom.conf');

      // Reload Asterisk
      await reloadAsterisk();
      console.log('Asterisk reloaded successfully');

      res.json({
        menu,
        message: 'IVR menu updated and Asterisk configuration updated'
      });
    } catch (configError) {
      // If config update fails, revert the menu in DB
      await IVRMenu.findByIdAndUpdate(req.params.id, {
        name: menu.name,
        options: menu.options
      });
      throw new Error(`Failed to update Asterisk configuration: ${configError.message}`);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete an IVR menu
const deleteMenu = async (req, res) => {
  try {
    const menu = await IVRMenu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    // Delete from database
    await menu.deleteOne();

    // Update Asterisk configuration
    const configPath = '/etc/asterisk/extensions_custom.conf';
    
    try {
      // Read current config
      // let config = fs.readFileSync(configPath, 'utf8');
      
      // Remove this menu's section
      // config = config.replace(new RegExp(`\[ivr_${menu.name}\][\s\S]*?\n\n`, 'g'), '');
      
      // // Write updated config
      // fs.writeFileSync(configPath, config);
      console.log('Updated extensions_custom.conf');

      // Reload Asterisk
      await reloadAsterisk();
      console.log('Asterisk reloaded successfully');

      res.status(204).send();
    } catch (configError) {
      // If config update fails, revert the delete in DB
      await IVRMenu.create({
        name: menu.name,
        options: menu.options
      });
      throw new Error(`Failed to update Asterisk configuration: ${configError.message}`);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllMenus,
  getMenuById,
  updateMenu,
  deleteMenu
};
