import { useState, useEffect } from "react";
import { useWorkoutConext } from "../hooks/useWorkoutsContext";
import {
  getWorkoutExercises,
  addExerciseToCategory,
} from "../utils/exerciseService";
import "../styles/components/WorkoutForm.css";

const WorkoutForm = ({ initialDate, onWorkoutAdded }) => {
  const { dispatch } = useWorkoutConext();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [workoutType, setWorkoutType] = useState("weights");

  // Weights workout fields
  const [sets, setSets] = useState([{ setNumber: 1, reps: "", weight: "" }]);

  // Cardio workout fields
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState("km");

  const [error, setError] = useState(null);
  const [emptyFields, setEmptyFields] = useState([]);
  const [isCustomExercise, setIsCustomExercise] = useState(false);
  const [newExercise, setNewExercise] = useState("");
  const [exercises, setExercises] = useState({});
  const [loading, setLoading] = useState(true);

  // State for workout date
  const [workoutDate, setWorkoutDate] = useState(() => {
    // Format date as YYYY-MM-DD for input field
    if (initialDate) {
      return initialDate.toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  });

  // Fetch exercises when component mounts
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const data = await getWorkoutExercises();
        console.log('Raw exercise data:', data); 
        setExercises(data);
      } catch (error) {
        setError("Failed to load exercises. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  // FIXED: Only reset form state when workout type actually changes
  // Remove the dependency on sets.length to prevent unwanted resets
  useEffect(() => {
    if (workoutType === "weights") {
      setDuration("");
      setDistance("");
      // Only initialize sets if they're empty
      if (sets.length === 0) {
        setSets([{ setNumber: 1, reps: "", weight: "" }]);
      }
    } else {
      // Only reset sets when switching TO cardio, not during normal sets operations
      setSets([]);
    }

    // FIXED: Don't reset category and title here - let user keep their selections
    // Only reset if this is the initial load or user explicitly changes workout type
  }, [workoutType]); // Removed sets.length dependency

  const handleAddSet = () => {
    // FIXED: Use functional state update to prevent issues with stale state
    setSets((prevSets) => [
      ...prevSets,
      { setNumber: prevSets.length + 1, reps: "", weight: "" },
    ]);
  };

  const updateSet = (index, field, value) => {
    setSets((prevSets) => {
      const newSets = [...prevSets];
      newSets[index][field] = value;
      return newSets;
    });
  };

  const incrementValue = (index, field, increment) => {
    setSets((prevSets) => {
      const newSets = [...prevSets];
      const currentValue = newSets[index][field];

      if (field === "reps") {
        // Increment reps by 1, min 0
        const newValue = Number(currentValue || 0) + increment;
        newSets[index][field] = Math.max(0, newValue).toString();
      } else if (field === "weight") {
        // Increment weight by 2.5, min 0
        const currentNum = Number(currentValue || 0);
        const newValue = Number((currentNum + increment * 2.5).toFixed(1));
        newSets[index][field] = Math.max(0, newValue).toString();
      }

      return newSets;
    });
  };

  const removeSet = (index) => {
    setSets((prevSets) => {
      const newSets = prevSets
        .filter((_, i) => i !== index)
        .map((set, i) => ({ ...set, setNumber: i + 1 }));
      return newSets;
    });
  };

  const handleCategoryChange = (selectedCategory) => {
    setCategory(selectedCategory);
    // Reset title when category changes
    setTitle("");
    // Reset custom exercise toggle
    setIsCustomExercise(false);
    // Reset new exercise input
    setNewExercise("");
  };

  // FIXED: Add explicit workout type change handler
  const handleWorkoutTypeChange = (newType) => {
    setWorkoutType(newType);
    // Only reset category and title when user explicitly changes workout type
    setCategory("");
    setTitle("");
    setIsCustomExercise(false);
    setNewExercise("");
  };

  const handleAddNewExercise = async () => {
    if (newExercise.trim() && category) {
      try {
        setError(null);
        // Use the updated function that calls the API
        const updatedExercises = await addExerciseToCategory(
          category,
          newExercise.trim()
        );

        // Update local state with the new exercises
        setExercises(updatedExercises);

        // Set the newly added exercise as the selected title
        setTitle(newExercise.trim());

        // Reset the new exercise input
        setNewExercise("");

        // Exit custom exercise mode
        setIsCustomExercise(false);
      } catch (error) {
        setError(error.message || "Failed to add exercise");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEmptyFields([]);

    // Find the selected exercise and get its isBodyweight property
    const selectedExercise = exercises[category]?.find(ex => ex.name === title);
    const isBodyweight = selectedExercise?.isBodyweight || false;
    
    console.log('Selected exercise:', selectedExercise);
    console.log('isBodyweight:', isBodyweight);

    let workoutData = {
      title,
      category,
      workoutType,
      isBodyweight, // This should now be correct!
      createdAt: new Date(workoutDate).toISOString()
    };

    if (workoutType === "weights") {
      // FIXED: Validate sets for weights workout - allow 0 weight
      const invalidSets = sets.some(set => !set.reps || (set.weight === undefined || set.weight === null || set.weight === ''));

      if (invalidSets) {
        setError("Please fill in all set details");
        return;
      }

      workoutData.sets = sets.map((set) => ({
        setNumber: set.setNumber,
        reps: Number(set.reps),
        weight: Number(set.weight),
      }));
    } else {
      // Validate cardio workout data
      if (!duration || !distance) {
        const missingFields = [];
        if (!duration) missingFields.push("duration");
        if (!distance) missingFields.push("distance");

        setEmptyFields(missingFields);
        setError("Please fill in all cardio details");
        return;
      }

      workoutData.cardio = {
        duration: Number(duration),
        distance: Number(distance),
        distanceUnit,
      };
    }

    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        body: JSON.stringify(workoutData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error);
        setEmptyFields(json.emptyFields || []);
      } else {
        // Reset form
        setTitle("");
        setCategory("");
        setSets([{ setNumber: 1, reps: "", weight: "" }]);
        setDuration("");
        setDistance("");
        setDistanceUnit("km");
        setError(null);
        setEmptyFields([]);
        dispatch({ type: "CREATE_WORKOUT", payload: json });

        // Notify parent component if callback provided
        if (onWorkoutAdded) {
          onWorkoutAdded();
        }
      }
    } catch (error) {
      setError("Failed to submit workout. Please try again.");
    }
  };

  // Render category options based on workout type
  const renderCategoryOptions = () => {
    if (workoutType === "weights") {
      return (
        <>
          <option value="">Select Category</option>
          <option value="Legs">Legs</option>
          <option value="Chest">Chest</option>
          <option value="Back">Back</option>
          <option value="Shoulders">Shoulders</option>
          <option value="Arms">Arms</option>
          <option value="Core">Core</option>
        </>
      );
    } else {
      return (
        <>
          <option value="">Select Category</option>
          <option value="Running">Running</option>
          <option value="Cycling">Cycling</option>
          <option value="Swimming">Swimming</option>
          <option value="Rowing">Rowing</option>
          <option value="Elliptical">Elliptical</option>
        </>
      );
    }
  };

  // Render the appropriate form based on workout type
  const renderWorkoutInputs = () => {
    if (workoutType === "weights") {
      // Weight training form
      return (
        <div className="sets-container">
          <h4>Sets</h4>
          {sets.map((set, index) => (
            <div key={index} className="set-input-group">
              <span>Set {set.setNumber}</span>

              <div className="input-with-buttons">
                <button
                  type="button"
                  onClick={() => incrementValue(index, "weight", -1)}
                  className="increment-btn"
                >
                  -
                </button>
                <input
                  type="number"
                  placeholder="Weight(kg)"
                  value={set.weight}
                  onChange={(e) => updateSet(index, "weight", e.target.value)}
                  className="set-input"
                  required
                  min="0"
                  step="0.1"
                />
                <button
                  type="button"
                  onClick={() => incrementValue(index, "weight", 1)}
                  className="increment-btn"
                >
                  +
                </button>
              </div>

              <div className="input-with-buttons">
                <button
                  type="button"
                  onClick={() => incrementValue(index, "reps", -1)}
                  className="increment-btn"
                >
                  -
                </button>
                <input
                  type="number"
                  placeholder="Reps"
                  value={set.reps}
                  onChange={(e) => updateSet(index, "reps", e.target.value)}
                  className="set-input"
                  required
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => incrementValue(index, "reps", 1)}
                  className="increment-btn"
                >
                  +
                </button>
              </div>

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
            className="add-set-btn-main"
          >
            Add Another Set
          </button>
        </div>
      );
    } else {
      // Cardio workout form
      return (
        <div className="cardio-container">
          <h4>Cardio Details</h4>
          <div className="form-group">
            <label>Duration (minutes):</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={emptyFields.includes("duration") ? "error" : ""}
              required
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
                className={`distance-input ${
                  emptyFields.includes("distance") ? "error" : ""
                }`}
                required
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
      );
    }
  };

  return (
    <form className="create-workout-container" onSubmit={handleSubmit}>
      <h3>Add a new Workout</h3>
      
      <div className="form-group">
        <label>Workout Type:</label>
        <div className="workout-type-selector">
          <button
            type="button"
            className={`workout-type-btn ${
              workoutType === "weights" ? "active" : ""
            }`}
            onClick={() => handleWorkoutTypeChange("weights")}
          >
            Weights
          </button>
          <button
            type="button"
            className={`workout-type-btn ${
              workoutType === "cardio" ? "active" : ""
            }`}
            onClick={() => handleWorkoutTypeChange("cardio")}
          >
            Cardio
          </button>
        </div>
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

      <label>Category:</label>
      <select
        onChange={(e) => handleCategoryChange(e.target.value)}
        value={category}
        className={emptyFields.includes("category") ? "error" : ""}
        required
      >
        {renderCategoryOptions()}
      </select>
      
      {workoutType === "weights" && !loading && category && (
        <div className="exercise-selection">
          <label>Exercise:</label>
          {!isCustomExercise ? (
            <select
              value={title}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustomExercise(true);
                  setTitle("");
                } else {
                  setTitle(e.target.value);
                }
              }}
              required
            >
              <option value="">Select Exercise</option>
              <option value="custom">Add Custom Exercise</option>
              {exercises[category] &&
                exercises[category].map((exercise) => {
                  // Handle both old format (string) and new format (object)
                  const exerciseName =
                    typeof exercise === "string" ? exercise : exercise.name;
                  return (
                    <option key={exerciseName} value={exerciseName}>
                      {exerciseName}
                    </option>
                  );
                })}
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
                    setNewExercise("");
                  }}
                  className="cancel-custom-exercise-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {workoutType === "cardio" && category && (
        <div className="exercise-selection">
          <label>Activity Name:</label>
          {!isCustomExercise ? (
            <select
              value={title}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustomExercise(true);
                  setTitle("");
                } else {
                  setTitle(e.target.value);
                }
              }}
              className={emptyFields.includes("title") ? "error" : ""}
              required
            >
              <option value="">Select {category} Activity</option>
              <option value="custom">Add Custom Activity</option>
              {exercises[category] &&
                exercises[category].map((activity) => {
                  // Handle both old format (string) and new format (object)
                  const activityName =
                    typeof activity === "string" ? activity : activity.name;
                  return (
                    <option key={activityName} value={activityName}>
                      {activityName}
                    </option>
                  );
                })}
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
                    setNewExercise("");
                  }}
                  className="cancel-custom-exercise-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render the appropriate input fields based on workout type */}
      {category && renderWorkoutInputs()}
      
      <button type="submit">Save Exercise</button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};

export default WorkoutForm;