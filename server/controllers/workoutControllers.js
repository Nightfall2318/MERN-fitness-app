const Workout = require("../models/workoutModel");
const mongoose = require('mongoose')
// get all workouts
const getWorkouts = async (req, res) => {
  const workouts = await Workout.find({}).sort({ createdAt: -1 });

  res.status(200).json(workouts);
};

// get a single workout

const getSingleWorkout = async (req, res) => {
  const { id } = req.params;

  if(!mongoose.Types.ObjectId.isValid(id)){
    return res.status(404).json({error: 'No such workout'})
  }

  const singleWorkout = await Workout.findById(id);

  if (!singleWorkout) {
    res.status(404).json({ error: "No workout found" });
  } else {
    res.status(200).json(singleWorkout);
  }
};

const createWorkout = async (req, res) => {
  const { title, reps, weight, category } = req.body;

  let emptyFields = [];

  if (!title) emptyFields.push('title');
  if (!reps) emptyFields.push('reps');
  if (!weight) emptyFields.push('weight');
  if (!category) emptyFields.push('category');

  if (emptyFields.length > 0) {
    return res.status(400).json({
      error: 'Error: one or more fields are missing', 
      emptyFields,
    });
  }
  
  if (reps || weight <= 0){
    return res.status(400).json({
      error: 'Error: reps and weight cannot equal 0 or less ',
      emptyFields,
    });
  }

  // Add workout to database
  try {
    const workout = await Workout.create({ title, reps, weight,category });
    res.status(200).json(workout);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// delete a workout

const deleteWorkout = async(req,res) => {
    const { id } = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(404).json({error: 'No such workout'})
    }

    const workout = await Workout.findOneAndDelete({_id: id})
    
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

  const workout = await Workout.findByIdAndUpdate(
      { _id: id },
      { ...req.body },
      { new: true } // Return updated document
  );

  if (!workout) {
      return res.status(404).json({ error: "No workout found" });
  }

  res.status(200).json(workout);
};


module.exports = {
  createWorkout,
  getWorkouts,
  getSingleWorkout,
  deleteWorkout,
  updateWorkout
};
