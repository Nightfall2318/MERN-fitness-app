// Check if this code appears in your dashboard component

import React, { useEffect } from 'react';
import ExerciseProgressDashboard from '../components/ExerciseProgressDashboard';
import { useWorkoutConext } from '../hooks/useWorkoutsContext';

const Dashboard = () => {
  const { workouts, dispatch } = useWorkoutConext();

  // Make sure this useEffect runs to load workouts
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

  // Add console logs for debugging
  console.log("Dashboard rendering");
  console.log("Workouts:", workouts);

  return (
    <div className="dashboard-page">
      <h1>Your Progress Dashboard</h1>
      <p>Select an exercise to view your progress over time.</p>
      
      <ExerciseProgressDashboard />

      {/* Add debugging element */}
      <div style={{marginTop: '20px', padding: '10px', border: '1px solid #ccc'}}>
        <p>Dashboard loaded. Workouts count: {workouts ? workouts.length : 0}</p>
      </div>
    </div>
  );
};

export default Dashboard;