import { useState, useEffect } from "react";
import { useWorkoutConext } from "../hooks/useWorkoutsContext";
import { getWorkoutExercises, addExerciseToCategory } from "../utils/exerciseService";

const WorkoutForm = () => {
   const { dispatch } = useWorkoutConext();
   const [title, setTitle] = useState('');
   const [category, setCategory] = useState('');
   const [sets, setSets] = useState([{ setNumber: 1, reps: '', weight: '' }]);
   const [error, setError] = useState(null);
   const [emptyFields, setEmptyFields] = useState([]);
   const [isCustomExercise, setIsCustomExercise] = useState(false);
   const [newExercise, setNewExercise] = useState('');
   const [exercises, setExercises] = useState({});
   const [loading, setLoading] = useState(true);

   // Fetch exercises when component mounts
   useEffect(() => {
     const fetchExercises = async () => {
       try {
         const data = await getWorkoutExercises();
         setExercises(data);
       } catch (error) {
         setError('Failed to load exercises. Please try again later.');
       } finally {
         setLoading(false);
       }
     };

     fetchExercises();
   }, []);

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

    const incrementValue = (index, field, increment) => {
        const newSets = [...sets];
        const currentValue = newSets[index][field];
        
        if (field === 'reps') {
            // Increment reps by 1, min 0
            const newValue = Number(currentValue || 0) + increment;
            newSets[index][field] = Math.max(0, newValue).toString();
        } else if (field === 'weight') {
            // Increment weight by 2.5, min 0
            const currentNum = Number(currentValue || 0);
            const newValue = Number((currentNum + increment * 2.5).toFixed(1));
            newSets[index][field] = Math.max(0, newValue).toString();
        }
        
        setSets(newSets);
    };

    const removeSet = (index) => {
        const newSets = sets.filter((_, i) => i !== index)
            .map((set, i) => ({...set, setNumber: i + 1}));
        setSets(newSets);
    };

   const handleCategoryChange = (selectedCategory) => {
        setCategory(selectedCategory);
        // Reset title when category changes
        setTitle('');
        // Reset custom exercise toggle
        setIsCustomExercise(false);
        // Reset new exercise input
        setNewExercise('');
    };

    const handleAddNewExercise = async () => {
        if (newExercise.trim() && category) {
            try {
                setError(null);
                // Use the updated function that calls the API
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate sets - ensure all sets have reps and weight
        const invalidSets = sets.some(set => !set.reps || !set.weight);
        
        if (invalidSets) {
            setError('Please fill in all set details');
            return;
        }

        const workout = { 
            title, 
            category, 
            sets: sets.map(set => ({
                setNumber: set.setNumber,
                reps: Number(set.reps),
                weight: Number(set.weight)
            }))
        };

        const response = await fetch('/api/workouts', {
            method: 'POST',
            body: JSON.stringify(workout),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const json = await response.json();

        if (!response.ok) {
            setError(json.error);
            setEmptyFields(json.emptyFields || []);
        } else {
            // Reset form
            setTitle('');
            setCategory('');
            setSets([{ setNumber: 1, reps: '', weight: '' }]);
            setError(null);
            setEmptyFields([]);
            dispatch({ type: 'CREATE_WORKOUT', payload: json });
        }
    };

    return (
        <form className="create-workout-container" onSubmit={handleSubmit}>
            <h3>Add a new Workout</h3>

            <label>Category:</label>
            <select
                onChange={(e) => handleCategoryChange(e.target.value)}
                value={category}
                className={emptyFields.includes("category") ? "error" : ""}
                required
            >
                <option value="">Select Category</option>
                <option value="Legs">Legs</option>
                <option value="Chest">Chest</option>
                <option value="Back">Back</option>
                <option value="Shoulders">Shoulders</option>
                <option value="Arms">Arms</option>
                <option value="Core">Core</option>
            </select>

            {loading && category && (
                <div className="loading">Loading exercises...</div>
            )}

            {!loading && category && (
                <div className="exercise-selection">
                    <label>Exercise:</label>
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
                            required
                        >
                            <option value="">Select Exercise</option>
                            <option value="custom">Add Custom Exercise</option>
                            {exercises[category] && exercises[category].map((exercise) => (
                                <option key={exercise} value={exercise}>
                                    {exercise}
                                </option>
                            ))}
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
                    )}
                </div>
            )}

            <div className="sets-container">
                <h4>Sets</h4>
                {sets.map((set, index) => (
                    <div key={index} className="set-input-group">
                        <span>Set {set.setNumber}</span>
                        
                        <div className="input-with-buttons">                           
                            <button 
                                type="button"
                                onClick={() => incrementValue(index, 'weight', -1)}
                                className="increment-btn"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                placeholder="Weight(kg)"
                                value={set.weight}
                                onChange={(e) => updateSet(index, 'weight', e.target.value)}
                                className="set-input"
                                required
                                min="0"
                                step="0.1"
                            />
                            <button 
                                type="button"
                                onClick={() => incrementValue(index, 'weight', 1)}
                                className="increment-btn"
                            >
                                +
                            </button>
                        </div>

                        <div className="input-with-buttons">
                            <button 
                                type="button"
                                onClick={() => incrementValue(index, 'reps', -1)}
                                className="increment-btn"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                placeholder="Reps"
                                value={set.reps}
                                onChange={(e) => updateSet(index, 'reps', e.target.value)}
                                className="set-input"
                                required
                                min="0"
                            />
                            <button 
                                type="button"
                                onClick={() => incrementValue(index, 'reps', 1)}
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
                <button 
                    type="submit"
                >
                    Save Exercise
                </button>
                {error && <div className="error">{error}</div>}
            </div>
        </form>
    );
};

export default WorkoutForm;