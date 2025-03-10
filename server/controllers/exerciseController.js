// controllers/exerciseController.js
const Exercise = require('../models/exerciseModel');
const mongoose = require('mongoose');

// Get all exercises
const getExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find({}).sort({ category: 1, name: 1 });
    
    // Convert to the structure your frontend expects (grouped by category)
    const exercisesByCategory = exercises.reduce((acc, exercise) => {
      if (!acc[exercise.category]) {
        acc[exercise.category] = [];
      }
      acc[exercise.category].push(exercise.name);
      return acc;
    }, {});
    
    res.status(200).json(exercisesByCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get exercises by category
const getExercisesByCategory = async (req, res) => {
  const { category } = req.params;
  
  try {
    const exercises = await Exercise.find({ category }).sort({ name: 1 });
    const exerciseNames = exercises.map(exercise => exercise.name);
    
    res.status(200).json(exerciseNames);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add a new exercise
const createExercise = async (req, res) => {
  const { name, category } = req.body;
  
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }
  
  try {
    const exercise = await Exercise.create({
      name: name.trim(),
      category,
      isDefault: false
    });
    
    res.status(201).json(exercise);
  } catch (error) {
    // Handle duplicate exercise error
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Exercise already exists in this category' });
    }
    res.status(400).json({ error: error.message });
  }
};

// Delete an exercise (only allowing non-default exercises to be deleted)
const deleteExercise = async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Invalid exercise ID' });
  }
  
  try {
    const exercise = await Exercise.findById(id);
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    // Prevent deletion of default exercises
    if (exercise.isDefault) {
      return res.status(403).json({ error: 'Cannot delete default exercises' });
    }
    
    const deletedExercise = await Exercise.findByIdAndDelete(id);
    res.status(200).json(deletedExercise);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Initialize the database with default exercises if they don't exist
const initializeDefaultExercises = async (req, res) => {
  const DEFAULT_WORKOUT_EXERCISES = {

    //weights 
    Legs: [
      'Calf Raises', 'Deadlifts', 'Hack Squats', 'Leg Curls', 
      'Leg Extensions', 'Leg Press', 'Lunges', 'Romanian Deadlifts', 
      'Squats', 'Step-Ups'
    ],
    Chest: [
      'Bench Press', 'Cable Flyes', 'Chest Pullovers', 'Close Grip Bench Press',
      'Decline Bench Press', 'Dips', 'Dumbbell Flyes', 'Incline Bench Press',
      'Machine Chest Press', 'Push-Ups'
    ],
    Back: [
      'Bent Over Rows', 'Deadlifts', 'Face Pulls', 'Good Mornings',
      'Hyperextensions', 'Lat Pulldowns', 'Pull-Ups', 'Seated Cable Rows',
      'Single-Arm Dumbbell Rows', 'T-Bar Rows'
    ],
    Shoulders: [
      'Arnold Press', 'Cable Lateral Raises', 'Face Pulls', 'Front Raises',
      'Lateral Raises', 'Military Press', 'Reverse Flyes', 'Shrugs',
      'Shoulder Press', 'Upright Rows'
    ],
    Arms: [
      'Bicep Curls', 'Cable Tricep Kickbacks', 'Concentration Curls', 'Hammer Curls',
      'Overhead Tricep Extensions', 'Preacher Curls', 'Reverse Curls', 'Skull Crushers',
      'Tricep Dips', 'Tricep Pushdowns'
    ],
    Core: [
      'Ab Rollouts', 'Bicycle Crunches', 'Cable Crunches', 'Crunches',
      'Dead Bugs', 'Leg Raises', 'Mountain Climbers', 'Planks',
      'Russian Twists', 'Side Planks'
    ],

    //cardio 
    Running: [
      '5K Run', 'Treadmill', 'Interval Running', 'Trail Running', 'Sprint Training'
    ],
    Cycling: [
      'Road Cycling', 'Stationary Bike', 'Spin Class', 'Mountain Biking', 'Interval Cycling'
    ],
    Swimming: [
      'Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Mixed Swim'
    ],
    Rowing: [
      'Rowing Machine', 'Outdoor Rowing', 'Interval Rowing', 'Endurance Row', 'Sprint Row'
    ],
    Elliptical: [
      'Standard Elliptical', 'Cross-Trainer', 'Interval Training', 'Reverse Stride', 'Hill Climb'
    ]
  };

  try {
    const operations = [];
    
    // Create an operation for each default exercise
    for (const [category, exercises] of Object.entries(DEFAULT_WORKOUT_EXERCISES)) {
      for (const exercise of exercises) {
        operations.push({
          updateOne: {
            filter: { name: exercise, category },
            update: { $setOnInsert: { name: exercise, category, isDefault: true } },
            upsert: true
          }
        });
      }
    }
    
    if (operations.length > 0) {
      await Exercise.bulkWrite(operations);
    }
    
    res.status(200).json({ message: 'Default exercises initialized' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getExercises,
  getExercisesByCategory,
  createExercise,
  deleteExercise,
  initializeDefaultExercises
};