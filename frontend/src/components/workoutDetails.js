// components/WorkoutDetails.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkoutConext } from "../hooks/useWorkoutsContext";
import { getWorkoutExercises, addExerciseToCategory } from "../utils/exerciseService";
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
  const [error, setError] = useState(null);
  
  // Custom exercise states
  const [isCustomExercise, setIsCustomExercise] = useState(false);
  const [newExercise, setNewExercise] = useState('');
  
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
  
  // Handle category change (reset title and custom exercise state)
  const handleCategoryChange = (selectedCategory) => {
    setCategory(selectedCategory);
    setTitle('');
    setIsCustomExercise(false);
    setNewExercise('');
  };
  
  // Handle adding new custom exercise
  const handleAddNewExercise = async () => {
    if (newExercise.trim() && category) {
      try {
        setError(null);
        // Use the function that calls the API
        const updatedExercises = await addExerciseToCategory(category, newExercise.trim());
        
        // Update local state with the new exercises
        setExercises(updatedExercises);
        
        // Set the newly added exercise as the selected title
        setTitle(newExercise.trim());
        
        // Reset the new exercise input
        setNewExercise('');
        
        // Exit custom exercise mode
        setIsCustomExercise(false);
      } catch (error) {
        setError(error.message || 'Failed to add exercise');
      }
    }
  };

  // Fetch exercises when editing begins
  useEffect(() => {
    if (isEditing) {
      const fetchExercises = async () => {
        setLoading(true);
        try {
          const data = await getWorkoutExercises();
          console.log('Exercise data in edit:', data);
          setExercises(data);
        } catch (error) {
          console.error('Failed to load exercises:', error);
          setError('Failed to load exercises. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchExercises();
    }
  }, [isEditing]);

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

    // Find the selected exercise and get its isBodyweight property
    const selectedExercise = exercises[category]?.find(ex => {
      // Handle both old format (string) and new format (object)
      if (typeof ex === 'string') {
        return ex === title;
      } else {
        return ex.name === title;
      }
    });
    
    // If it's an object, get the isBodyweight property; otherwise default to false
    const isBodyweight = (selectedExercise && typeof selectedExercise === 'object') ? 
      selectedExercise.isBodyweight : false;

    console.log('Edit - Selected exercise:', selectedExercise);
    console.log('Edit - isBodyweight:', isBodyweight);

    const updatedWorkout = { 
      title, 
      category, 
      workoutType,
      isBodyweight, // Add this field!
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
      setError(null);
    } else {
      setError(json.error || 'Failed to update workout');
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
            <label>Category:</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
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
            <label>Exercise:</label>
            {loading ? (
              <div className="loading">Loading exercises...</div>
            ) : (
              !isCustomExercise ? (
                <select 
                  value={title} 
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomExercise(true);
                      setTitle('');
                    } else {
                      setTitle(e.target.value);
                    }
                  }}
                  className="form-select"
                >
                  <option value="">Select Exercise</option>
                  <option value="custom">Add Custom Exercise</option>
                  {category && exercises[category] && 
                    exercises[category].map((exercise) => {
                      // Handle both old format (string) and new format (object)
                      const exerciseName = typeof exercise === 'string' ? exercise : exercise.name;
                      return (
                        <option key={exerciseName} value={exerciseName}>
                          {exerciseName}
                        </option>
                      );
                    })
                  }
                  {/* Add current exercise if not in the list */}
                  {category && exercises[category] && title && title !== 'custom' && (
                    // Check if current title exists in the exercise list
                    !exercises[category].some(ex => 
                      typeof ex === 'string' ? ex === title : ex.name === title
                    ) && (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    )
                  )}
                </select>
              ) : (
                <div className="custom-exercise-input">
                  <input
                    type="text"
                    placeholder="Enter custom exercise"
                    value={newExercise}
                    onChange={(e) => setNewExercise(e.target.value)}
                    required
                  />
                  <div className="custom-exercise-actions">
                    <button 
                      type="button" 
                      onClick={handleAddNewExercise}
                      className="add-custom-exercise-btn"
                      disabled={!newExercise.trim()}
                    >
                      Add Exercise
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsCustomExercise(false);
                        setNewExercise('');
                      }}
                      className="cancel-custom-exercise-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            )}
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
                  min="0"
                  step="0.1"
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
            <label>Category:</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="form-select"
            >
              <option value="Running">Running</option>
              <option value="Cycling">Cycling</option>
              <option value="Swimming">Swimming</option>
              <option value="Rowing">Rowing</option>
              <option value="Elliptical">Elliptical</option>
            </select>
          </div>

          <div className="form-group">
            <label>Activity Name:</label>
            {!isCustomExercise ? (
              <select
                value={title}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomExercise(true);
                    setTitle('');
                  } else {
                    setTitle(e.target.value);
                  }
                }}
                className="form-select"
              >
                <option value="">Select {category} Activity</option>
                <option value="custom">Add Custom Activity</option>
                {category && exercises[category] && 
                  exercises[category].map((activity) => {
                    // Handle both old format (string) and new format (object)
                    const activityName = typeof activity === 'string' ? activity : activity.name;
                    return (
                      <option key={activityName} value={activityName}>
                        {activityName}
                      </option>
                    );
                  })
                }
                {/* Add current activity if not in the list */}
                {category && exercises[category] && title && title !== 'custom' && (
                  // Check if current title exists in the activity list
                  !exercises[category].some(ex => 
                    typeof ex === 'string' ? ex === title : ex.name === title
                  ) && (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  )
                )}
              </select>
            ) : (
              <div className="custom-exercise-input">
                <input
                  type="text"
                  placeholder="Enter custom activity"
                  value={newExercise}
                  onChange={(e) => setNewExercise(e.target.value)}
                  required
                />
                <div className="custom-exercise-actions">
                  <button 
                    type="button" 
                    onClick={handleAddNewExercise}
                    className="add-custom-exercise-btn"
                    disabled={!newExercise.trim()}
                  >
                    Add Activity
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCustomExercise(false);
                      setNewExercise('');
                    }}
                    className="cancel-custom-exercise-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
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
            <button className="cancelBtn" onClick={() => {
              setIsEditing(false);
              setIsCustomExercise(false);
              setError(null);
              // Reset to original values
              setTitle(workout.title);
              setCategory(workout.category);
              setWorkoutDate(formatDateForInput(workout.createdAt));
              
              if (workout.workoutType === 'cardio') {
                setDuration(workout.cardio?.duration || '');
                setDistance(workout.cardio?.distance || '');
                setDistanceUnit(workout.cardio?.distanceUnit || 'km');
              } else {
                setSets(Array.isArray(workout.sets) ? workout.sets : [{
                  setNumber: 1, 
                  reps: workout.reps || '', 
                  weight: workout.weight || ''
                }]);
              }
            }}>Cancel</button>
          </div>
          {error && <div className="error">{error}</div>}
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