// pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ExerciseProgressDashboard from '../components/ExerciseProgressDashboard';
import { useWorkoutConext } from '../hooks/useWorkoutsContext';

const Dashboard = () => {
  const { workouts, dispatch } = useWorkoutConext();
  const location = useLocation();
  const [preSelectedExercise, setPreSelectedExercise] = useState(null);
  const [preSelectedCategory, setPreSelectedCategory] = useState(null);

  // Extract URL parameters on component mount or URL change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const exercise = searchParams.get('exercise');
    const category = searchParams.get('category');
    
    console.log('Dashboard URL Parameters:', { exercise, category });
    
    if (exercise) {
      setPreSelectedExercise(exercise);
    }
    
    if (category) {
      setPreSelectedCategory(category);
    }
  }, [location.search]);

  // Fetch workouts when component mounts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch('/api/workouts');
        const json = await response.json();

        if (response.ok) {
          dispatch({ type: 'SET_WORKOUTS', payload: json });
          console.log('Workouts fetched:', json.length);
        } else {
          console.error('Failed to fetch workouts:', json);
        }
      } catch (error) {
        console.error('Error fetching workouts:', error);
      }
    };

    fetchWorkouts();
  }, [dispatch]);

  return (
    <div className="dashboard-page">
      <h1>Your Progress Dashboard</h1>
      <p>Select an exercise to view your progress over time.</p>
      
      {/* Add key prop to force component to remount when URL params change */}
      <ExerciseProgressDashboard 
        key={`${preSelectedCategory}-${preSelectedExercise}`}
        preSelectedExercise={preSelectedExercise}
        preSelectedCategory={preSelectedCategory}
      />
    </div>
  );
};

export default Dashboard;