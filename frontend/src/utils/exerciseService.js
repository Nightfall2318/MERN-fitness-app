// utils/exerciseService.js
// This replaces workExercises.js

// Cache for exercises to minimize API calls
let exercisesCache = null;

// Function to fetch all exercises
export const getWorkoutExercises = async () => {
  try {
    // Return cached data if available
    if (exercisesCache) {
      return exercisesCache;
    }
    
    const response = await fetch('/api/exercises');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exercises');
    }
    
    const exercises = await response.json();
    exercisesCache = exercises;
    return exercises;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    // Return empty categories as fallback
    return {
      Legs: [],
      Chest: [],
      Back: [],
      Shoulders: [],
      Arms: [],
      Core: []
    };
  }
};

// Function to fetch exercises for a specific category
export const getExercisesByCategory = async (category) => {
  try {
    // Check if we have the category in cache first
    if (exercisesCache && exercisesCache[category]) {
      return exercisesCache[category];
    }
    
    const response = await fetch(`/api/exercises/category/${category}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exercises for ${category}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${category} exercises:`, error);
    return [];
  }
};

// Function to add a new exercise
export const addExerciseToCategory = async (category, exerciseName) => {
  try {
    const response = await fetch('/api/exercises', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: exerciseName,
        category
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add exercise');
    }
    
    // Clear cache to ensure fresh data on next fetch
    exercisesCache = null;
    
    // Refetch all exercises to get updated list
    return await getWorkoutExercises();
  } catch (error) {
    console.error('Error adding exercise:', error);
    throw error;
  }
};

// Initialize default exercises if needed (call this when your app starts)
export const initializeExercises = async () => {
  try {
    const response = await fetch('/api/exercises/initialize', {
      method: 'POST'
    });
    
    if (!response.ok) {
      console.error('Failed to initialize default exercises');
    }
    
    // Load exercises into cache
    await getWorkoutExercises();
  } catch (error) {
    console.error('Error initializing exercises:', error);
  }
};