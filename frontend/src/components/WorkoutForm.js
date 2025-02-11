
import { useState } from "react"
import { useWorkoutConext } from "../hooks/useWorkoutsContext";

const WorkoutForm = () => {
    const{ dispatch } = useWorkoutConext()
    const[title, setTitle] = useState('');
    const[weight, setWeight] = useState('');
    const[reps, setReps] = useState('');
    const[category, setCategory] = useState('');
    const[error, setError] = useState(null);
    const[emptyFields,setEmptyFields] = useState([])

    const handleSubmit = async (e) => {
         e.preventDefault()

         const workout = {title,weight,reps,category}
         const response = await fetch('/api/workouts',{
            method:'POST',
            body: JSON.stringify(workout),
            headers: {
                'Content-Type': 'application/json'
            }
         })
         const json = await response.json()

         if(!response.ok){
            setError(json.error)
            setEmptyFields(json.emptyFields)
         } else {
            setTitle('')
            setWeight('')
            setReps('')
            setCategory('')
            setError(null)
            setEmptyFields([])
            console.log('new workout added', json)
            dispatch({type:'CREATE_WORKOUT', payload: json})
         }
    }

return (
  <form className="create-workout-container" onSubmit={handleSubmit}>
        <h3> Add new Workout </h3>

        <label> Exercise Title: </label>
        <input
        type="text"
        onChange={(e)=> setTitle(e.target.value)}   
        value={title}    
        className={emptyFields.includes('title') ? 'error' : ''}
        />

        <label> Weight(KG): </label>
        <input
        type="number"
        onChange={(e)=> setWeight(e.target.value)}
        value={weight}   
        className={emptyFields.includes('weight') ? 'error' : ''}  
        />

        <label> Reps: </label>
        <input
        type="number"
        onChange={(e)=> setReps(e.target.value)}  
        value={reps}    
        className={emptyFields.includes('reps') ? 'error' : ''}
        />

         <label> Category </label>
         <select
         onChange={(e) => setCategory(e.target.value)}
         value={category}
         className={emptyFields.includes("category") ? "error" : ""}
         >
         <option value="">Select Category</option>
         <option value="Legs">Legs</option>
         <option value="chest">Chest</option>
         <option value="back">Back</option>
         <option value="shoulders">Shoulders</option>
         <option value="arms">Arms</option>
         <option value="core">Core</option>
         </select>


        <button> Save Exercise </button>
        {error && <div className="error-container">{error}</div>}

  </form>
)

}

export default WorkoutForm  