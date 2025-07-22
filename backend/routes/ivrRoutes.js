const express = require("express");
const { createIVRMenu } = require("../controllers/ivrControllers/createIVRMenu");
const { getAllMenus, getMenuById, deleteMenu } = require("../controllers/ivrControllers/ivr_controller");
const ivrRoutes = express.Router()

// Create IVR Menu
ivrRoutes.post('/menu', createIVRMenu)

// Get all IVR Menus
ivrRoutes.get('/menu', getAllMenus)

// Get single IVR Menu by ID
ivrRoutes.get('/menu/:id', getMenuById)

// Delete IVR Menu
ivrRoutes.delete('/menu/:id', deleteMenu)

module.exports = ivrRoutes;
