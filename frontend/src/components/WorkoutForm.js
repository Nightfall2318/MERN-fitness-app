import { useState } from "react"
import { useWorkoutConext } from "../hooks/useWorkoutsContext";

const WorkoutForm = () => {
    const { dispatch } = useWorkoutConext()
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [sets, setSets] = useState([{ setNumber: 1, reps: '', weight: '' }]);
    const [error, setError] = useState(null);
    const [emptyFields, setEmptyFields] = useState([])

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
        const newSets = sets.filter((_, i) => i !== index)
            .map((set, i) => ({...set, setNumber: i + 1}));
        setSets(newSets);
    };

    const handleSubmit = async (e) => {
        e.preventDefault()

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
        }

        const response = await fetch('/api/workouts', {
            method: 'POST',
            body: JSON.stringify(workout),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const json = await response.json()

        if (!response.ok) {
            setError(json.error)
            setEmptyFields(json.emptyFields || [])
        } else {
            // Reset form
            setTitle('')
            setCategory('')
            setSets([{ setNumber: 1, reps: '', weight: '' }])
            setError(null)
            setEmptyFields([])
            dispatch({ type: 'CREATE_WORKOUT', payload: json })
        }
    }

    return (
        <form className="create-workout-container" onSubmit={handleSubmit}>
            <h3>Add a new Workout</h3>

            <label>Exercise Title:</label>
            <input
                type="text"
                onChange={(e) => setTitle(e.target.value)}   
                value={title}    
                className={emptyFields.includes('title') ? 'error' : ''}
                required
            />

            <label>Category:</label>
            <select
                onChange={(e) => setCategory(e.target.value)}
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
                            required
                            min="1"
                        />
                        <input
                            type="number"
                            placeholder="Weight (kg)"
                            value={set.weight}
                            onChange={(e) => updateSet(index, 'weight', e.target.value)}
                            required
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

            <button type="submit">Save Exercise</button>
            {error && <div className="error-container">{error}</div>}
        </form>
    )
}

export default WorkoutForm