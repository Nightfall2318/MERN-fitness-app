// components/WorkoutDetails.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkoutConext } from "../hooks/useWorkoutsContext";
import { getWorkoutExercises } from "../utils/exerciseService";
import '../styles/components/WorkoutDetails.css';

const WorkoutDetails = ({ workout }) => {
  const { dispatch } = useWorkoutConext();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(workout.title);
  const [category, setCategory] = useState(workout.category);
  const [workoutType] = useState(workout.workoutType || 'weights');
  const [exercises, setExercises] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Format date for the date input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Add state for workout date
  const [workoutDate, setWorkoutDate] = useState(formatDateForInput(workout.createdAt));
  
  // Ensure sets is always an array, even if the data is incorrect
  const [sets, setSets] = useState(() => {
    if (workout.workoutType === 'cardio') {
      return [];
    }
    
    // If sets is not an array, create a default set from old data
    if (!Array.isArray(workout.sets)) {
      return [{
        setNumber: 1, 
        reps: workout.reps || '', 
        weight: workout.weight || ''
      }];
    }
    return workout.sets;
  });
  
  // Cardio state
  const [duration, setDuration] = useState(workout.cardio?.duration || '');
  const [distance, setDistance] = useState(workout.cardio?.distance || '');
  const [distanceUnit, setDistanceUnit] = useState(workout.cardio?.distanceUnit || 'km');
  
  // Category colors - same as in Dashboard
  const categoryColors = {
    // Weights categories
    'Legs': '#FF5733', // Orange-red
    'Chest': '#33A8FF', // Blue
    'Back': '#33FF57', // Green
    'Shoulders': '#B533FF', // Purple
    'Arms': '#FFFF33', // Yellow
    'Core': '#FF33A8', // Pink
    
    // Cardio categories
    'Running': '#FF0000', // Red
    'Cycling': '#00AAFF', // Light Blue
    'Swimming': '#00FFFF', // Cyan
    'Rowing': '#FF9900', // Orange
    'Elliptical': '#9933FF', // Purple
  };

  // Fetch exercises when editing begins
  useEffect(() => {
    if (isEditing && workoutType === 'weights') {
      const fetchExercises = async () => {
        setLoading(true);
        try {
          const data = await getWorkoutExercises();
          setExercises(data);
        } catch (error) {
          console.error('Failed to load exercises:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchExercises();
    }
  }, [isEditing, workoutType]);

  const handleAddSet = () => {
    setSets([
      ...sets, 
      { setNumber: sets.length + 1, reps: '', weight: '' }
    ]);
  };

  const updateSet = (index, field, value) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const removeSet = (index) => {
    const newSets = sets.filter((_, i) => i !== index);
    // Renumber the sets
    setSets(newSets.map((set, i) => ({...set, setNumber: i + 1})));
  };

  const handleEdit = async () => {
    // Create a date object from the date input
    const updatedDate = new Date(workoutDate);
    
    // Preserve the original time portion if available
    const originalDate = new Date(workout.createdAt);
    if (!isNaN(originalDate.getTime())) {
      updatedDate.setHours(originalDate.getHours());
      updatedDate.setMinutes(originalDate.getMinutes());
      updatedDate.setSeconds(originalDate.getSeconds());
    }

    const updatedWorkout = { 
      title, 
      category, 
      sets,
      createdAt: updatedDate.toISOString()  // Use the updated date
    };

    if (workoutType === 'weights') {
      updatedWorkout.sets = sets;
    } else {
      updatedWorkout.cardio = {
        duration: Number(duration),
        distance: Number(distance),
        distanceUnit
      };
    }

    const response = await fetch(`/api/workouts/${workout._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedWorkout),
    });

    const json = await response.json();

    if (response.ok) {
      dispatch({ type: "UPDATE_WORKOUT", payload: json });
      setIsEditing(false);
    }
  };

  const handleClick = async () => {
    const response = await fetch('/api/workouts/' + workout._id, {
      method: 'DELETE'
    });
    const json = await response.json();

    if (response.ok) {
      dispatch({ type: 'DELETE_WORKOUT', payload: json });
    }
  };

  // Navigate to dashboard to view exercise progress
  const handleViewProgress = () => {
    navigate(`/dashboard?exercise=${encodeURIComponent(workout.title)}&category=${encodeURIComponent(workout.category)}&type=${encodeURIComponent(workout.workoutType || 'weights')}`);
  };

  // Safe mapping function for weight sets
  const renderSets = (setsToRender) => {
    // Ensure setsToRender is an array
    const safeSets = Array.isArray(setsToRender) ? setsToRender : [];
    
    // If no sets, create a default set from old data
    if (safeSets.length === 0 && (workout.reps || workout.weight)) {
      return (
        <div className="set-summary">
          <p>Set 1: {workout.reps} reps at {workout.weight} kg</p>
        </div>
      );
    }

    return safeSets.map((set, index) => (
      <div key={index} className="set-summary">
        <p>Set {set.setNumber}: {set.reps} reps at {set.weight} kg</p>
      </div>
    ));
  };

  // Render cardio details
  const renderCardioDetails = () => {
    if (!workout.cardio) return null;
    
    return (
      <div className="cardio-summary">
        <p><strong>Duration:</strong> {workout.cardio.duration} minutes</p>
        <p><strong>Distance:</strong> {workout.cardio.distance} {workout.cardio.distanceUnit}</p>
        <p><strong>Pace:</strong> {calculatePace(workout.cardio)}</p>
      </div>
    );
  };

  // Calculate pace from cardio data
  const calculatePace = (cardioData) => {
    if (!cardioData || !cardioData.duration || !cardioData.distance) {
      return 'N/A';
    }
    
    // Calculate pace (minutes per km or mi)
    const pace = cardioData.duration / cardioData.distance;
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds} min/${cardioData.distanceUnit}`;
  };

  // Render the appropriate form inputs based on workout type
  const renderEditForm = () => {
    if (workoutType === 'weights') {
      return (
        <>
          <div className="form-group">
            <label>Exercise:</label>
            {loading ? (
              <div className="loading">Loading exercises...</div>
            ) : (
              <select 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="form-select"
              >
                {category && exercises[category] && 
                  exercises[category].map((exercise) => (
                    <option key={exercise} value={exercise}>
                      {exercise}
                    </option>
                  ))
                }
                {/* Add current exercise if not in the list */}
                {category && exercises[category] && 
                  !exercises[category].includes(title) && (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  )
                }
              </select>
            )}
          </div>

          <div className="form-group">
            <label>Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="Legs">Legs</option>
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Shoulders">Shoulders</option>
              <option value="Arms">Arms</option>
              <option value="Core">Core</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="sets-container">
            <h4>Sets</h4>
            {sets.map((set, index) => (
              <div key={index} className="set-input-group">
                <input
                  type="number"
                  placeholder="Reps"
                  value={set.reps}
                  onChange={(e) => updateSet(index, 'reps', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={set.weight}
                  onChange={(e) => updateSet(index, 'weight', e.target.value)}
                />
                {sets.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeSet(index)}
                    className="remove-set-btn"
                  >
                    Remove Set
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={handleAddSet}
              className="add-set-btn"
            >
              Add Another Set
            </button>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="form-group">
            <label>Activity Name:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="Running">Running</option>
              <option value="Cycling">Cycling</option>
              <option value="Swimming">Swimming</option>
              <option value="Rowing">Rowing</option>
              <option value="Elliptical">Elliptical</option>
            </select>
          </div>

          <div className="cardio-container">
            <h4>Cardio Details</h4>
            <div className="form-group">
              <label>Duration (minutes):</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="0"
                step="1"
              />
            </div>
            
            <div className="form-group">
              <label>Distance:</label>
              <div className="distance-input-container">
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="distance-input"
                  min="0"
                  step="0.01"
                />
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value)}
                  className="distance-unit"
                >
                  <option value="km">km</option>
                  <option value="mi">mi</option>
                </select>
              </div>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div className="workout-details-container">
      {isEditing ? (
        <div className="edit-form">
          {renderEditForm()}
          <div className="form-action-buttons">
            <button className="saveBtn" onClick={handleEdit}>Save</button>
            <button className="cancelBtn" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="workout-header">
            <div className="workout-title-container">
              <span 
                className="category-dot" 
                style={{ backgroundColor: categoryColors[workout.category] }} 
                title={workout.category}
              ></span>
              <h3 className="workout-title" onClick={handleViewProgress}>{workout.title}</h3>
              {workout.workoutType === 'cardio' && (
                <span className="workout-type-badge cardio">Cardio</span>
              )}
              {(workout.workoutType === 'weights' || !workout.workoutType) && (
                <span className="workout-type-badge weights">Weights</span>
              )}
            </div>
            <span className="material-symbols-outlined delete-icon" onClick={handleClick}>
              delete
            </span>
          </div>
          <p><strong>Category: </strong>{workout.category}</p>
          
          {/* Display either sets or cardio info based on workout type */}
          {(workout.workoutType === 'weights' || !workout.workoutType) && (
            <div className="sets-summary">
              {renderSets(workout.sets)}
            </div>
          )}
          
          {workout.workoutType === 'cardio' && renderCardioDetails()}
          
          <p><strong>Date: </strong>{new Date(workout.createdAt).toLocaleDateString()}</p>

          <div className="button-container">
            <button className="viewProgressBtn" onClick={handleViewProgress}>View Progress</button>
            <button className="editBtn" onClick={() => setIsEditing(true)}>Edit</button>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkoutDetails;