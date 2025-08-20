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
      acc[exercise.category].push({
        name: exercise.name,
        isBodyweight: exercise.isBodyweight
      });
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
    const exerciseData = exercises.map(exercise => ({
      name: exercise.name,
      isBodyweight: exercise.isBodyweight
    }));
    
    res.status(200).json(exerciseData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add a new exercise
const createExercise = async (req, res) => {
  const { name, category, isBodyweight } = req.body;
  
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }
  
  try {
    const exercise = await Exercise.create({
      name: name.trim(),
      category,
      isBodyweight: isBodyweight || false,
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
    // Weights exercises
    Legs: [
      { name: 'Calf Raises', isBodyweight: false },
      { name: 'Deadlifts', isBodyweight: false },
      { name: 'Hack Squats', isBodyweight: false },
      { name: 'Leg Curls', isBodyweight: false },
      { name: 'Leg Extensions', isBodyweight: false },
      { name: 'Leg Press', isBodyweight: false },
      { name: 'Lunges', isBodyweight: true },
      { name: 'Romanian Deadlifts', isBodyweight: false },
      { name: 'Squats', isBodyweight: true },
      { name: 'Step-Ups', isBodyweight: true }
    ],
    Chest: [
      { name: 'Bench Press', isBodyweight: false },
      { name: 'Cable Flyes', isBodyweight: false },
      { name: 'Chest Pullovers', isBodyweight: false },
      { name: 'Close Grip Bench Press', isBodyweight: false },
      { name: 'Decline Bench Press', isBodyweight: false },
      { name: 'Dips', isBodyweight: true },
      { name: 'Dumbbell Flyes', isBodyweight: false },
      { name: 'Incline Bench Press', isBodyweight: false },
      { name: 'Machine Chest Press', isBodyweight: false },
      { name: 'Push-Ups', isBodyweight: true }
    ],
    Back: [
      { name: 'Bent Over Rows', isBodyweight: false },
      { name: 'Deadlifts', isBodyweight: false },
      { name: 'Face Pulls', isBodyweight: false },
      { name: 'Good Mornings', isBodyweight: false },
      { name: 'Hyperextensions', isBodyweight: true },
      { name: 'Lat Pulldowns', isBodyweight: false },
      { name: 'Pull-Ups', isBodyweight: true },
      { name: 'Seated Cable Rows', isBodyweight: false },
      { name: 'Single-Arm Dumbbell Rows', isBodyweight: false },
      { name: 'T-Bar Rows', isBodyweight: false }
    ],
    Shoulders: [
      { name: 'Arnold Press', isBodyweight: false },
      { name: 'Cable Lateral Raises', isBodyweight: false },
      { name: 'Face Pulls', isBodyweight: false },
      { name: 'Front Raises', isBodyweight: false },
      { name: 'Lateral Raises', isBodyweight: false },
      { name: 'Military Press', isBodyweight: false },
      { name: 'Reverse Flyes', isBodyweight: false },
      { name: 'Shrugs', isBodyweight: false },
      { name: 'Shoulder Press', isBodyweight: false },
      { name: 'Upright Rows', isBodyweight: false }
    ],
    Arms: [
      { name: 'Bicep Curls', isBodyweight: false },
      { name: 'Cable Tricep Kickbacks', isBodyweight: false },
      { name: 'Concentration Curls', isBodyweight: false },
      { name: 'Hammer Curls', isBodyweight: false },
      { name: 'Overhead Tricep Extensions', isBodyweight: false },
      { name: 'Preacher Curls', isBodyweight: false },
      { name: 'Reverse Curls', isBodyweight: false },
      { name: 'Skull Crushers', isBodyweight: false },
      { name: 'Tricep Dips', isBodyweight: true },
      { name: 'Tricep Pushdowns', isBodyweight: false }
    ],
    Core: [
      { name: 'Ab Rollouts', isBodyweight: true },
      { name: 'Bicycle Crunches', isBodyweight: true },
      { name: 'Cable Crunches', isBodyweight: false },
      { name: 'Crunches', isBodyweight: true },
      { name: 'Dead Bugs', isBodyweight: true },
      { name: 'Leg Raises', isBodyweight: true },
      { name: 'Mountain Climbers', isBodyweight: true },
      { name: 'Planks', isBodyweight: true },
      { name: 'Russian Twists', isBodyweight: true },
      { name: 'Side Planks', isBodyweight: true }
    ],

    // Cardio exercises - these don't use the isBodyweight field since they're cardio
    Running: [
      { name: '5K Run', isBodyweight: null },
      { name: 'Treadmill', isBodyweight: null },
      { name: 'Interval Running', isBodyweight: null },
      { name: 'Trail Running', isBodyweight: null },
      { name: 'Sprint Training', isBodyweight: null }
    ],
    Cycling: [
      { name: 'Road Cycling', isBodyweight: null },
      { name: 'Stationary Bike', isBodyweight: null },
      { name: 'Spin Class', isBodyweight: null },
      { name: 'Mountain Biking', isBodyweight: null },
      { name: 'Interval Cycling', isBodyweight: null }
    ],
    Swimming: [
      { name: 'Freestyle', isBodyweight: null },
      { name: 'Backstroke', isBodyweight: null },
      { name: 'Breaststroke', isBodyweight: null },
      { name: 'Butterfly', isBodyweight: null },
      { name: 'Mixed Swim', isBodyweight: null }
    ],
    Rowing: [
      { name: 'Rowing Machine', isBodyweight: null },
      { name: 'Outdoor Rowing', isBodyweight: null },
      { name: 'Interval Rowing', isBodyweight: null },
      { name: 'Endurance Row', isBodyweight: null },
      { name: 'Sprint Row', isBodyweight: null }
    ],
    Elliptical: [
      { name: 'Standard Elliptical', isBodyweight: null },
      { name: 'Cross-Trainer', isBodyweight: null },
      { name: 'Interval Training', isBodyweight: null },
      { name: 'Reverse Stride', isBodyweight: null },
      { name: 'Hill Climb', isBodyweight: null }
    ]
  };

  try {
    const operations = [];
    
    // Create an operation for each default exercise
    for (const [category, exercises] of Object.entries(DEFAULT_WORKOUT_EXERCISES)) {
      for (const exercise of exercises) {
        operations.push({
          updateOne: {
            filter: { name: exercise.name, category },
            update: { 
              $setOnInsert: { 
                name: exercise.name, 
                category, 
                isBodyweight: exercise.isBodyweight,
                isDefault: true 
              } 
            },
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