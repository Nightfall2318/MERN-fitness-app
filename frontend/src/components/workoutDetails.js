import { useState } from "react";
import { useWorkoutConext } from "../hooks/useWorkoutsContext";

const WorkoutDetails = ({ workout }) => {
  const { dispatch } = useWorkoutConext();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(workout.title);
  const [category, setCategory] = useState(workout.category);
  
  // Ensure sets is always an array, even if the data is incorrect
  const [sets, setSets] = useState(() => {
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
    const updatedWorkout = { 
      title, 
      category, 
      sets,
      createdAt: workout.createdAt  // Preserve original creation date
    };

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

  // Safe mapping function
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

  return (
    <div className="workout-details-container">
      {isEditing ? (
        <div className="edit-form">
          <div className="form-group">
            <label>Exercise:</label>
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
              <option value="Legs">Legs</option>
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Shoulders">Shoulders</option>
              <option value="Arms">Arms</option>
              <option value="Core">Core</option>
            </select>
          </div>

          <div className="sets-container">
            <h4>Sets</h4>
            {sets.map((set, index) => (
              <div key={index} className="set-input-group">
                <span>Set {set.setNumber}</span>
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

          <div className="button-container">
            <button className="saveBtn" onClick={handleEdit}>Save</button>
            <button className="cancelBtn" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <h3>{workout.title}</h3>
          <p><strong>Category: </strong>{workout.category}</p>
          <div className="sets-summary">
            {renderSets(workout.sets)}
          </div>
          <p><strong>Date: </strong>{new Date(workout.createdAt).toLocaleDateString()}</p>

          <div className="button-container">
            <button className="editBtn" onClick={() => setIsEditing(true)}>Edit</button>
            <span className="material-symbols-outlined delete-icon" onClick={handleClick}>
              delete
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkoutDetails;