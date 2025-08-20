// models/exerciseModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Legs', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Running', 'Cycling', 'Swimming', 'Rowing', 'Elliptical']
  },
  isBodyweight: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure exercise names are unique within a category
exerciseSchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Exercise', exerciseSchema);