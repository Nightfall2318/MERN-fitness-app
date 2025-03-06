// pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ExerciseProgressDashboard from '../components/ExerciseProgressDashboard';
import { useWorkoutConext } from '../hooks/useWorkoutsContext';

const Dashboard = () => {
  const { dispatch } = useWorkoutConext();
  const location = useLocation();
  const [preSelectedExercise, setPreSelectedExercise] = useState(null);
  const [preSelectedCategory, setPreSelectedCategory] = useState(null);

  // Extract URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const exercise = searchParams.get('exercise');
    const category = searchParams.get('category');
    
    if (exercise) {
      setPreSelectedExercise(exercise);
    }
    
    if (category) {
      setPreSelectedCategory(category);
    }
  }, [location]);

  useEffect(() => {
    const fetchWorkouts = async () => {
      const response = await fetch('/api/workouts');
      const json = await response.json();

      if (response.ok) {
        dispatch({ type: 'SET_WORKOUTS', payload: json });
      }
    };

    fetchWorkouts();
  }, [dispatch]);

  return (
    <div className="dashboard-page">
      <h1>Your Progress Dashboard</h1>
      <p>Select an exercise to view your progress over time.</p>
      
      <ExerciseProgressDashboard 
        preSelectedExercise={preSelectedExercise}
        preSelectedCategory={preSelectedCategory}
      />
    </div>
  );
};

export default Dashboard;