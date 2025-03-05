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
    const { title, category, sets } = req.body;

    let emptyFields = [];

    if (!title) emptyFields.push('title');
    if (!category) emptyFields.push('category');
    if (!sets || sets.length === 0) emptyFields.push('sets');

    // Validate each set
    if (sets) {
        sets.forEach((set, index) => {
            if (!set.reps || set.reps <= 0) emptyFields.push(`sets[${index}].reps`);
            if (!set.weight || set.weight <= 0) emptyFields.push(`sets[${index}].weight`);
        });
    }

    if (emptyFields.length > 0) {
        return res.status(400).json({
            error: 'Error: one or more fields are missing',
            emptyFields,
        });
    }

    // Add workout to database
    try {
        const workout = await Workout.create({ 
            title, 
            category, 
            sets 
        });
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

    const { title, category, sets } = req.body;

    // Validate sets
    if (!sets || sets.length === 0) {
        return res.status(400).json({ 
            error: 'At least one set is required',
            emptyFields: ['sets']
        });
    }

    try {
        const workout = await Workout.findByIdAndUpdate(
            { _id: id },
            { title, category, sets },
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