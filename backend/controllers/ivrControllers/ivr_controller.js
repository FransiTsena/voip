const IVRMenu = require('../../models/ivr_model');

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
    return res.json({
      menu,
      message: 'IVR menu updated and Asterisk configuration updated'
    });
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
    res.status(204).send();

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
