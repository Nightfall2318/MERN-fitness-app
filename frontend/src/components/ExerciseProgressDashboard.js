// components/ExerciseProgressDashboard.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWorkoutConext } from '../hooks/useWorkoutsContext';
import { getWorkoutExercises } from '../utils/exerciseService';

const ExerciseProgressDashboard = ({ preSelectedExercise, preSelectedCategory }) => {
  const { workouts } = useWorkoutConext();
  const [selectedExercise, setSelectedExercise] = useState('');
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('weight'); // 'weight' or 'reps'
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [progressData, setProgressData] = useState([]);

  // Fetch exercise categories and options when component mounts
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const exercisesData = await getWorkoutExercises();
        setCategories(Object.keys(exercisesData));
        
        // Set initial category if none selected
        if (!selectedCategory && Object.keys(exercisesData).length > 0) {
          setSelectedCategory(Object.keys(exercisesData)[0]);
        }
      } catch (error) {
        console.error('Error fetching exercise categories:', error);
      }
    };

    fetchExercises();
  }, []);

  // Handle pre-selected category from URL params
  useEffect(() => {
    if (preSelectedCategory && categories.includes(preSelectedCategory)) {
      setSelectedCategory(preSelectedCategory);
    }
  }, [preSelectedCategory, categories]);

  // Update exercise options when category changes
  useEffect(() => {
    const fetchExerciseOptions = async () => {
      if (!selectedCategory) return;
      
      try {
        const exercisesData = await getWorkoutExercises();
        setExerciseOptions(exercisesData[selectedCategory] || []);
        
        // If we have a pre-selected exercise and options are loaded, select it
        if (preSelectedExercise && 
            exercisesData[selectedCategory] && 
            exercisesData[selectedCategory].includes(preSelectedExercise)) {
          setSelectedExercise(preSelectedExercise);
        }
      } catch (error) {
        console.error('Error fetching exercises for category:', error);
      }
    };

    fetchExerciseOptions();
  }, [selectedCategory, preSelectedExercise]);

  // Generate progress data when workouts or selected exercise changes
  useEffect(() => {
    if (!workouts || !selectedExercise) {
      setProgressData([]);
      return;
    }

    // Filter workouts that match the selected exercise
    const relevantWorkouts = workouts.filter(workout => 
      workout.title.toLowerCase() === selectedExercise.toLowerCase()
    );

    if (relevantWorkouts.length === 0) {
      setProgressData([]);
      return;
    }

    // Map the workouts to chart data format
    const chartData = relevantWorkouts.map(workout => {
      // For each workout, calculate the average weight and max reps across all sets
      const totalWeight = workout.sets.reduce((sum, set) => sum + set.weight, 0);
      const avgWeight = totalWeight / workout.sets.length;
      
      const maxReps = Math.max(...workout.sets.map(set => set.reps));
      
      const date = new Date(workout.createdAt);
      
      return {
        date: date.toLocaleDateString(),
        timestamp: date.getTime(), // For sorting
        avgWeight: avgWeight,
        maxReps: maxReps,
        // Include individual set data for detailed view
        sets: workout.sets.map(set => ({
          setNumber: set.setNumber,
          weight: set.weight,
          reps: set.reps
        }))
      };
    });

    // Sort by date (earliest to latest)
    const sortedData = chartData.sort((a, b) => a.timestamp - b.timestamp);
    setProgressData(sortedData);
  }, [workouts, selectedExercise]);

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedExercise(''); // Reset exercise selection when category changes
  };

  const handleExerciseChange = (e) => {
    setSelectedExercise(e.target.value);
  };

  const handleMetricChange = (e) => {
    setSelectedMetric(e.target.value);
  };

  return (
    <div className="exercise-progress-dashboard">
      <h2>Exercise Progress Dashboard</h2>
      
      <div className="dashboard-controls">
        <div className="control-group">
          <label>Category:</label>
          <select value={selectedCategory} onChange={handleCategoryChange}>
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Exercise:</label>
          <select 
            value={selectedExercise} 
            onChange={handleExerciseChange}
            disabled={!selectedCategory}
          >
            <option value="">Select Exercise</option>
            {exerciseOptions.map(exercise => (
              <option key={exercise} value={exercise}>
                {exercise}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Metric:</label>
          <select value={selectedMetric} onChange={handleMetricChange}>
            <option value="weight">Weight</option>
            <option value="reps">Reps</option>
          </select>
        </div>
      </div>
      
      {selectedExercise && progressData.length > 0 ? (
        <div className="progress-chart-container">
          <h3>{selectedExercise} Progress</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={progressData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                label={{ 
                  value: selectedMetric === 'weight' ? 'Weight (kg)' : 'Reps', 
                  angle: -90, 
                  position: 'insideLeft' 
                }} 
              />
              <Tooltip />
              <Legend />
              {selectedMetric === 'weight' ? (
                <Line 
                  type="monotone" 
                  dataKey="avgWeight" 
                  name="Average Weight" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
              ) : (
                <Line 
                  type="monotone" 
                  dataKey="maxReps" 
                  name="Max Reps" 
                  stroke="#82ca9d" 
                  activeDot={{ r: 8 }} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          
          <div className="workout-history">
            <h3>Workout History</h3>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Set</th>
                  <th>Weight (kg)</th>
                  <th>Reps</th>
                </tr>
              </thead>
              <tbody>
                {progressData.map((workout, workoutIndex) => 
                  workout.sets.map((set, setIndex) => (
                    <tr key={`${workoutIndex}-${setIndex}`}>
                      {setIndex === 0 && <td rowSpan={workout.sets.length}>{workout.date}</td>}
                      <td>{set.setNumber}</td>
                      <td>{set.weight}</td>
                      <td>{set.reps}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-data-message">
          {selectedExercise ? 
            'No workout data available for this exercise yet.' : 
            'Select an exercise to view progress.'
          }
        </div>
      )}
    </div>
  );
};

export default ExerciseProgressDashboard;