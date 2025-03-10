const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Schema for weight training sets
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

// Schema for cardio workouts
const cardioSchema = new Schema({
    duration: {
        type: Number,  // in minutes
        required: true
    },
    distance: {
        type: Number,  // in kilometers or miles
        required: true
    },
    distanceUnit: {
        type: String,
        enum: ['km', 'mi'],
        default: 'km'
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
    workoutType: {
        type: String,
        enum: ['weights', 'cardio'],
        default: 'weights',
        required: true
    },
    // For weight training workouts
    sets: {
        type: [setSchema],
        validate: {
            validator: function(v) {
                if (this.workoutType === 'weights') {
                    return v && v.length > 0;
                }
                return true;
            },
            message: 'At least one set is required for weights workouts'
        }
    },
    // For cardio workouts
    cardio: {
        type: cardioSchema,
        validate: {
            validator: function(v) {
                if (this.workoutType === 'cardio') {
                    return v !== null && v !== undefined;
                }
                return true;
            },
            message: 'Cardio details are required for cardio workouts'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Workout', workoutSchema);