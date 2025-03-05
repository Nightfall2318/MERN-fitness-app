// routes/exercises.js
const express = require('express');
const {
  getExercises,
  getExercisesByCategory,
  createExercise,
  deleteExercise,
  initializeDefaultExercises
} = require('../controllers/exerciseController');

const router = express.Router();

// Get all exercises
router.get('/', getExercises);

// Get exercises by category
router.get('/category/:category', getExercisesByCategory);

// Add a new exercise
router.post('/', createExercise);

// Delete an exercise
router.delete('/:id', deleteExercise);

// Initialize default exercises
router.post('/initialize', initializeDefaultExercises);

module.exports = router;