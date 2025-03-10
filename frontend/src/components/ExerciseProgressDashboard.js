// components/ExerciseProgressDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWorkoutConext } from '../hooks/useWorkoutsContext';
import { getWorkoutExercises } from '../utils/exerciseService';
import '../styles/components/ExcerciseProgressDashboard.css';

const ExerciseProgressDashboard = ({ preSelectedExercise, preSelectedCategory, preSelectedType }) => {
  const { workouts } = useWorkoutConext();
  const [selectedExercise, setSelectedExercise] = useState('');
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('weight'); // 'weight', 'reps', 'distance', 'duration', or 'pace'
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [progressData, setProgressData] = useState([]);
  const [chartHeight, setChartHeight] = useState(window.innerWidth > 400 ? 400 : 250);
  const [workoutType, setWorkoutType] = useState(preSelectedType || 'weights');

  // Memoize category arrays to prevent recreating on every render
  const weightCategories = useMemo(() => ['Legs', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core'], []);
  const cardioCategories = useMemo(() => ['Running', 'Cycling', 'Swimming', 'Rowing', 'Elliptical'], []);

  // Handle window resize for responsive charts
  useEffect(() => {
    const handleResize = () => {
      setChartHeight(window.innerWidth > 400 ? 400 : 250);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle pre-selected workout type from URL params
  useEffect(() => {
    if (preSelectedType) {
      setWorkoutType(preSelectedType);
      // Reset metric to appropriate default for workout type
      if (preSelectedType === 'cardio' && selectedMetric === 'weight') {
        setSelectedMetric('distance');
      } else if (preSelectedType === 'weights' && ['distance', 'duration', 'pace'].includes(selectedMetric)) {
        setSelectedMetric('weight');
      }
    }
  }, [preSelectedType, selectedMetric]);

  // Fetch exercise categories and options when component mounts
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const exercisesData = await getWorkoutExercises();
        
        // Filter categories based on workout type
        const filteredCategories = Object.keys(exercisesData).filter(cat => {
          if (workoutType === 'weights') {
            return weightCategories.includes(cat);
          } else {
            return cardioCategories.includes(cat);
          }
        });
        
        setCategories(filteredCategories);
        
        // Reset selected category if it doesn't match the current workout type
        if (selectedCategory) {
          const isValidCategory = (workoutType === 'weights' && weightCategories.includes(selectedCategory)) ||
                                (workoutType === 'cardio' && cardioCategories.includes(selectedCategory));
          
          if (!isValidCategory) {
            setSelectedCategory('');
            setSelectedExercise('');
          }
        }
        
        // Set initial category if none selected
        if (!selectedCategory && filteredCategories.length > 0) {
          setSelectedCategory(filteredCategories[0]);
        }
      } catch (error) {
        console.error('Error fetching exercise categories:', error);
      }
    };

    fetchExercises();
  }, [workoutType, selectedCategory, weightCategories, cardioCategories]);

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

    // Filter workouts that match the selected exercise and workout type
    const relevantWorkouts = workouts.filter(workout => 
      workout.title.toLowerCase() === selectedExercise.toLowerCase() &&
      (workout.workoutType || 'weights') === workoutType
    );

    if (relevantWorkouts.length === 0) {
      setProgressData([]);
      return;
    }

    // Map the workouts to chart data format based on workout type
    const chartData = relevantWorkouts.map(workout => {
      const date = new Date(workout.createdAt);
      const formattedDate = date.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric'
      });
      
      if (workoutType === 'weights') {
        // For weight workouts, calculate the average weight and max reps across all sets
        const totalWeight = workout.sets.reduce((sum, set) => sum + Number(set.weight), 0);
        const avgWeight = parseFloat((totalWeight / workout.sets.length).toFixed(1));
        
        const maxReps = Math.max(...workout.sets.map(set => Number(set.reps)));
        
        return {
          date: formattedDate,
          timestamp: date.getTime(), // For sorting
          avgWeight: avgWeight,
          maxReps: maxReps,
          // Include individual set data for detailed view
          sets: workout.sets.map(set => ({
            setNumber: set.setNumber,
            weight: Number(set.weight),
            reps: Number(set.reps)
          }))
        };
      } else {
        // For cardio workouts
        if (!workout.cardio) {
          return {
            date: formattedDate,
            timestamp: date.getTime(),
            duration: 0,
            distance: 0,
            distanceUnit: 'km',
            pace: 0
          };
        }
        
        // Calculate pace (minutes per unit distance)
        const pace = parseFloat((workout.cardio.duration / workout.cardio.distance).toFixed(2));
        
        return {
          date: formattedDate,
          timestamp: date.getTime(),
          duration: workout.cardio.duration,
          distance: workout.cardio.distance,
          distanceUnit: workout.cardio.distanceUnit || 'km',
          pace: pace
        };
      }
    });

    // Sort by date (earliest to latest)
    const sortedData = chartData.sort((a, b) => a.timestamp - b.timestamp);
    setProgressData(sortedData);
  }, [workouts, selectedExercise, workoutType]);

  const handleWorkoutTypeChange = (type) => {
    setWorkoutType(type);
    setSelectedCategory('');
    setSelectedExercise('');
    
    // Reset metric based on workout type
    if (type === 'cardio') {
      setSelectedMetric('distance');
    } else {
      setSelectedMetric('weight');
    }
  };

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

  // Custom tooltip for weights workout
  const WeightsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          <p className="tooltip-data">
            {selectedMetric === 'weight' 
              ? `Avg Weight: ${payload[0].value}kg` 
              : `Max Reps: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for cardio workout
  const CardioTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          {selectedMetric === 'distance' && (
            <p className="tooltip-data">Distance: {data.distance} {data.distanceUnit}</p>
          )}
          {selectedMetric === 'duration' && (
            <p className="tooltip-data">Duration: {data.duration} min</p>
          )}
          {selectedMetric === 'pace' && (
            <p className="tooltip-data">
              Pace: {Math.floor(data.pace)}:{Math.round((data.pace % 1) * 60).toString().padStart(2, '0')} min/{data.distanceUnit}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Format for short display on mobile
  const formatXAxis = (tickItem) => {
    if (window.innerWidth < 400) {
      // Just return day for very small screens
      const dateParts = tickItem.split('/');
      return dateParts.length > 1 ? dateParts[1] : tickItem;
    }
    return tickItem;
  };

  // Helper function to get Y-axis label for cardio metrics
  const getYAxisLabel = () => {
    switch (selectedMetric) {
      case 'weight':
        return 'kg';
      case 'reps':
        return 'Reps';
      case 'distance':
        // Get the most common distance unit from the data
        const units = progressData.map(d => d.distanceUnit);
        const mostCommonUnit = units.sort((a, b) => 
          units.filter(v => v === a).length - units.filter(v => v === b).length
        ).pop();
        return mostCommonUnit || 'km';
      case 'duration':
        return 'minutes';
      case 'pace':
        return 'min/km';
      default:
        return '';
    }
  };

  // Format pace for display
  const formatPace = (pace) => {
    if (isNaN(pace) || pace === 0) return 'N/A';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace % 1) * 60);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // Render the line chart based on workout type and selected metric
  const renderChart = () => {
    return (
      <LineChart 
        data={progressData}
        margin={{ 
          top: 10, 
          right: 10, 
          left: window.innerWidth < 400 ? 0 : 20, 
          bottom: 5 
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatXAxis} 
          tick={{ fontSize: window.innerWidth < 400 ? 10 : 12 }}
        />
        <YAxis 
          label={{ 
            value: getYAxisLabel(), 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: window.innerWidth < 400 ? 10 : 12 }
          }} 
          tick={{ fontSize: window.innerWidth < 400 ? 10 : 12 }}
          width={window.innerWidth < 400 ? 25 : 35}
        />
        <Tooltip content={workoutType === 'weights' ? <WeightsTooltip /> : <CardioTooltip />} />
        <Legend wrapperStyle={{ fontSize: window.innerWidth < 400 ? 10 : 12 }} />
        
        {workoutType === 'weights' && selectedMetric === 'weight' && (
          <Line 
            type="monotone" 
            dataKey="avgWeight" 
            name="Avg Weight" 
            stroke="#8884d8" 
            activeDot={{ r: window.innerWidth < 400 ? 6 : 8 }} 
            strokeWidth={window.innerWidth < 400 ? 2 : 3}
          />
        )}
        
        {workoutType === 'weights' && selectedMetric === 'reps' && (
          <Line 
            type="monotone" 
            dataKey="maxReps" 
            name="Max Reps" 
            stroke="#82ca9d" 
            activeDot={{ r: window.innerWidth < 400 ? 6 : 8 }} 
            strokeWidth={window.innerWidth < 400 ? 2 : 3}
          />
        )}
        
        {workoutType === 'cardio' && selectedMetric === 'distance' && (
          <Line 
            type="monotone" 
            dataKey="distance" 
            name="Distance" 
            stroke="#FF7700" 
            activeDot={{ r: window.innerWidth < 400 ? 6 : 8 }} 
            strokeWidth={window.innerWidth < 400 ? 2 : 3}
          />
        )}
        
        {workoutType === 'cardio' && selectedMetric === 'duration' && (
          <Line 
            type="monotone" 
            dataKey="duration" 
            name="Duration (min)" 
            stroke="#0088FE" 
            activeDot={{ r: window.innerWidth < 400 ? 6 : 8 }} 
            strokeWidth={window.innerWidth < 400 ? 2 : 3}
          />
        )}
        
        {workoutType === 'cardio' && selectedMetric === 'pace' && (
          <Line 
            type="monotone" 
            dataKey="pace" 
            name="Pace (min/km)" 
            stroke="#00C49F" 
            activeDot={{ r: window.innerWidth < 400 ? 6 : 8 }} 
            strokeWidth={window.innerWidth < 400 ? 2 : 3}
          />
        )}
      </LineChart>
    );
  };

  // Render the appropriate metric selector based on workout type
  const renderMetricSelector = () => {
    if (workoutType === 'weights') {
      return (
        <div className="control-group">
          <label>Metric:</label>
          <select value={selectedMetric} onChange={handleMetricChange}>
            <option value="weight">Weight</option>
            <option value="reps">Reps</option>
          </select>
        </div>
      );
    } else {
      return (
        <div className="control-group">
          <label>Metric:</label>
          <select value={selectedMetric} onChange={handleMetricChange}>
            <option value="distance">Distance</option>
            <option value="duration">Duration</option>
            <option value="pace">Pace</option>
          </select>
        </div>
      );
    }
  };

  // Render workout history table based on workout type
  const renderWorkoutHistory = () => {
    if (workoutType === 'weights') {
      return (
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
              workout.sets && workout.sets.map((set, setIndex) => (
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
      );
    } else {
      return (
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Duration (min)</th>
              <th>Distance</th>
              <th>Pace</th>
            </tr>
          </thead>
          <tbody>
            {progressData.map((workout, index) => (
              <tr key={index}>
                <td>{workout.date}</td>
                <td>{workout.duration}</td>
                <td>{workout.distance} {workout.distanceUnit}</td>
                <td>{formatPace(workout.pace)} min/{workout.distanceUnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="exercise-progress-dashboard">
      <h2>Exercise Progress Dashboard</h2>
      
      <div className="dashboard-controls">
        <div className="control-group">
          <label>Workout Type:</label>
          <div className="workout-type-selector-small">
            <button
              className={`workout-type-btn ${workoutType === 'weights' ? 'active' : ''}`}
              onClick={() => handleWorkoutTypeChange('weights')}
            >
              Weights
            </button>
            <button
              className={`workout-type-btn ${workoutType === 'cardio' ? 'active' : ''}`}
              onClick={() => handleWorkoutTypeChange('cardio')}
            >
              Cardio
            </button>
          </div>
        </div>
        
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
        
        {renderMetricSelector()}
      </div>
      
      {selectedExercise && progressData.length > 0 ? (
        <div className="progress-chart-container">
          <h3>{selectedExercise} Progress</h3>
          
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={chartHeight}>
              {renderChart()}
            </ResponsiveContainer>
          </div>
          
          <div className="workout-history">
            <h3>Workout History</h3>
            <div className="table-container">
              {renderWorkoutHistory()}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data-message">
          {selectedExercise ? 
            `No ${workoutType} workout data available for this exercise yet.` : 
            'Select an exercise to view progress.'
          }
        </div>
      )}
    </div>
  );
};

export default ExerciseProgressDashboard;