const mongoose = require('mongoose');

// 1. Define the Schema for the nested destination object
const DestinationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Destination type is required'],
    enum: ['extension', 'ivr', 'queue', 'recording'], // Enforce allowed types
  },
  id: {
    type: String,
    required: [true, 'Destination ID is required'],
    trim: true,
  },
});

// 2. Define the main MiscApplication Schema
const MiscApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      unique: true, // Assuming misc application names should be unique
    },
    featureCode: {
      type: String,
      required: [true, 'Feature Code is required'],
      trim: true,
      unique: true, // Feature codes should typically be unique
      match: [/^\d+$/, 'Feature Code must be numbers only'], // Ensures numbers only
    },
    // Use the nested schema for the destination field
    destination: {
      type: DestinationSchema,
      required: [true, 'Destination is required'],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// 3. Create and export the Mongoose Model
const MiscApplication = mongoose.model('MiscApplication', MiscApplicationSchema);

module.exports = MiscApplication;