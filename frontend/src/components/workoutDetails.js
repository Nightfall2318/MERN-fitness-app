import { useState } from "react";
import { useWorkoutConext } from "../hooks/useWorkoutsContext";

const WorkoutDetails = ({ workout }) => {
  const { dispatch } = useWorkoutConext();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(workout.title);
  const [weight, setWeight] = useState(workout.weight);
  const [reps, setReps] = useState(workout.reps);
  const [sets, setSets] = useState(workout.sets);
  const [category, setCategory] = useState(workout.category);
  const [date, setDate] = useState(
    new Date(workout.createdAt).toISOString().split('T')[0]
  );

  const handleEdit = async () => {
    const updatedWorkout = { 
      title, 
      weight, 
      reps, 
      sets,
      category,
      createdAt: new Date(date).toISOString()
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
            <label>Weight (kg):</label>
            <input 
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Reps:</label>
            <input 
              type="number" 
              value={reps} 
              onChange={(e) => setReps(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Sets:</label>
            <input 
              type="number" 
              value={sets} 
              onChange={(e) => setSets(e.target.value)}
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

          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="button-container">
            <button className="saveBtn" onClick={handleEdit}>Save</button>
            <button className="cancelBtn" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <h3>{workout.title}</h3>
          <p><strong>Weight(kg): </strong>{workout.weight}</p>
          <p><strong>Reps: </strong>{workout.reps}</p>
          <p><strong>Sets: </strong>{workout.sets}</p>
          <p><strong>Category: </strong>{workout.category}</p>
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