// workoutModel.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const workoutSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    reps: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    sets: {
        type:Number,
        required: true
    }, 
    category: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now  // This allows both automatic and manual date setting
    }
});

module.exports = mongoose.model('Workout', workoutSchema);