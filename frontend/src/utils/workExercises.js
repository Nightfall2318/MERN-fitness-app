// utils/workExercises.js
const DEFAULT_WORKOUT_EXERCISES = {
    Legs: [
        'Calf Raises',
        'Deadlifts',
        'Hack Squats',
        'Leg Curls',
        'Leg Extensions',
        'Leg Press',
        'Lunges',
        'Romanian Deadlifts',
        'Squats',
        'Step-Ups'
    ],
    Chest: [
        'Bench Press',
        'Cable Flyes',
        'Chest Pullovers',
        'Close Grip Bench Press',
        'Decline Bench Press',
        'Dips',
        'Dumbbell Flyes',
        'Incline Bench Press',
        'Machine Chest Press',
        'Push-Ups'
    ],
    Back: [
        'Bent Over Rows',
        'Deadlifts',
        'Face Pulls',
        'Good Mornings',
        'Hyperextensions',
        'Lat Pulldowns',
        'Pull-Ups',
        'Seated Cable Rows',
        'Single-Arm Dumbbell Rows',
        'T-Bar Rows'
    ],
    Shoulders: [
        'Arnold Press',
        'Cable Lateral Raises',
        'Face Pulls',
        'Front Raises',
        'Lateral Raises',
        'Military Press',
        'Reverse Flyes',
        'Shrugs',
        'Shoulder Press',
        'Upright Rows'
    ],
    Arms: [
        'Bicep Curls',
        'Cable Tricep Kickbacks',
        'Concentration Curls',
        'Hammer Curls',
        'Overhead Tricep Extensions',
        'Preacher Curls',
        'Reverse Curls',
        'Skull Crushers',
        'Tricep Dips',
        'Tricep Pushdowns'
    ],
    Core: [
        'Ab Rollouts',
        'Bicycle Crunches',
        'Cable Crunches',
        'Crunches',
        'Dead Bugs',
        'Leg Raises',
        'Mountain Climbers',
        'Planks',
        'Russian Twists',
        'Side Planks'
    ]
};

// Function to get the current workout exercises (with potential custom additions)
export const getWorkoutExercises = () => {
    const storedExercises = localStorage.getItem('customWorkoutExercises');
    
    if (storedExercises) {
        const parsedExercises = JSON.parse(storedExercises);
        
        // Ensure all default categories exist
        Object.keys(DEFAULT_WORKOUT_EXERCISES).forEach(category => {
            if (!parsedExercises[category]) {
                parsedExercises[category] = [...DEFAULT_WORKOUT_EXERCISES[category]];
            }
        });
        
        return parsedExercises;
    }
    
    // If no stored exercises, return default
    return JSON.parse(JSON.stringify(DEFAULT_WORKOUT_EXERCISES));
};

// Export the exercises as a variable that can be updated
export let WORKOUT_EXERCISES = getWorkoutExercises();

// Function to add a new exercise to a specific category
export const addExerciseToCategory = (category, newExercise) => {
    // Ensure the category exists
    if (!WORKOUT_EXERCISES[category]) {
        WORKOUT_EXERCISES[category] = [];
    }
    
    // Check if the exercise isn't already in the list
    if (!WORKOUT_EXERCISES[category].includes(newExercise)) {
        // Add the new exercise and sort the array
        WORKOUT_EXERCISES[category].push(newExercise);
        WORKOUT_EXERCISES[category].sort();
        
        // Save to local storage
        localStorage.setItem('customWorkoutExercises', JSON.stringify(WORKOUT_EXERCISES));
    }
    
    return WORKOUT_EXERCISES[category];
};

// Initialize exercises when the module is loaded
export const initializeWorkoutExercises = () => {
    WORKOUT_EXERCISES = getWorkoutExercises();
};

// Call initialization when the module loads
initializeWorkoutExercises();