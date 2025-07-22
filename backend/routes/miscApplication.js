const express = require("express");
const { createMiscApplication, getAllMiscApplications, deleteMiscApplication } = require("../controllers/miscApplication/miscApplication");
const miscApplicationRoute = express.Router()

// Create IVR Menu
miscApplicationRoute.post('/', createMiscApplication)

// Get all IVR Menus
miscApplicationRoute.get('/', getAllMiscApplications)

// Get single IVR Menu by ID
//miscApplicationRoute.get('/misc/:id', getMenuById)

// Delete IVR Menu   
miscApplicationRoute.delete('/:id', deleteMiscApplication)

module.exports = miscApplicationRoute;
