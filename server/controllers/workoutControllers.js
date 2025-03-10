const Workout = require("../models/workoutModel");
const mongoose = require('mongoose');

// get all workouts
const getWorkouts = async (req, res) => {
    const workouts = await Workout.find({}).sort({ createdAt: -1 });
    res.status(200).json(workouts);
};

// get a single workout
const getSingleWorkout = async (req, res) => {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such workout'});
    }

    const singleWorkout = await Workout.findById(id);

    if (!singleWorkout) {
        res.status(404).json({ error: "No workout found" });
    } else {
        res.status(200).json(singleWorkout);
    }
};

const createWorkout = async (req, res) => {
    const { title, category, workoutType, sets, cardio } = req.body;

    let emptyFields = [];

    if (!title) emptyFields.push('title');
    if (!category) emptyFields.push('category');
    if (!workoutType) emptyFields.push('workoutType');

    // Validate based on workout type
    if (workoutType === 'weights') {
        if (!sets || sets.length === 0) emptyFields.push('sets');

        // Validate each set for weights workout
        if (sets) {
            sets.forEach((set, index) => {
                if (!set.reps || set.reps <= 0) emptyFields.push(`sets[${index}].reps`);
                if (!set.weight || set.weight <= 0) emptyFields.push(`sets[${index}].weight`);
            });
        }
    } else if (workoutType === 'cardio') {
        if (!cardio) emptyFields.push('cardio');
        
        // Validate cardio details
        if (cardio) {
            if (!cardio.duration || cardio.duration <= 0) emptyFields.push('cardio.duration');
            if (!cardio.distance || cardio.distance <= 0) emptyFields.push('cardio.distance');
            if (!cardio.distanceUnit) emptyFields.push('cardio.distanceUnit');
        }
    }

    if (emptyFields.length > 0) {
        return res.status(400).json({
            error: 'Error: one or more fields are missing',
            emptyFields,
        });
    }

    // Create workout with appropriate structure based on type
    try {
        const workoutData = { 
            title, 
            category,
            workoutType
        };

        // Add type-specific data
        if (workoutType === 'weights') {
            workoutData.sets = sets;
        } else if (workoutType === 'cardio') {
            workoutData.cardio = cardio;
        }

        const workout = await Workout.create(workoutData);
        res.status(200).json(workout);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// delete a workout
const deleteWorkout = async(req,res) => {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such workout'});
    }

    const workout = await Workout.findOneAndDelete({_id: id});

    if (!workout) {
        res.status(404).json({ error: "No workout found" });
    } else {
        res.status(200).json(workout);
    }
};

// update a workout
const updateWorkout = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such workout' });
    }

    const { title, category, workoutType, sets, cardio } = req.body;

    let emptyFields = [];
    
    // Validate based on workout type
    if (workoutType === 'weights') {
        if (!sets || sets.length === 0) {
            emptyFields.push('sets');
        }
    } else if (workoutType === 'cardio') {
        if (!cardio) {
            emptyFields.push('cardio');
        }
    }

    if (emptyFields.length > 0) {
        return res.status(400).json({ 
            error: 'Required fields are missing',
            emptyFields
        });
    }

    try {
        const workoutData = { 
            title, 
            category,
            workoutType
        };

        // Add type-specific data
        if (workoutType === 'weights') {
            workoutData.sets = sets;
        } else if (workoutType === 'cardio') {
            workoutData.cardio = cardio;
        }

        const workout = await Workout.findByIdAndUpdate(
            { _id: id },
            workoutData,
            { new: true, runValidators: true }
        );

        if (!workout) {
            return res.status(404).json({ error: "No workout found" });
        }

        res.status(200).json(workout);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    createWorkout,
    getWorkouts,
    getSingleWorkout,
    deleteWorkout,
    updateWorkout
};