const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const setSchema = new Schema({
    setNumber: {
        type: Number,
        required: true
    },
    reps: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    }
});

const workoutSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    sets: {
        type: [setSchema],
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'At least one set is required'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Workout', workoutSchema);