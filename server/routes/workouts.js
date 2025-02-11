
const express = require('express')
const 
{
    createWorkout,
    getWorkouts,
    getSingleWorkout,
    deleteWorkout,
    updateWorkout} = require('../controllers/workoutControllers')


const router = express.Router();

//get response for all workouts
router.get('/', getWorkouts)

//get response for a single workout
router.get('/:id', getSingleWorkout) 

//POST a single workout
router.post('/', createWorkout)

//Delete a single workout
router.delete('/:id', deleteWorkout)

//get response for a single workout
router.patch('/:id', updateWorkout)

module.exports = router;