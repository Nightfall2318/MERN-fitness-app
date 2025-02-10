import { useEffect, useState } from "react";
import { useWorkoutConext } from "../hooks/useWorkoutsContext";
import WorkoutDetails from '../components/workoutDetails';
import WorkoutForm from '../components/WorkoutForm';

const Home = () => {
  const { workouts, dispatch } = useWorkoutConext();
  const [selectedDate, setSelectedDate] = useState(null);
  const [groupedWorkouts, setGroupedWorkouts] = useState({});

  useEffect(() => {
    const fetchWorkouts = async () => {
      const response = await fetch('/api/workouts');
      const json = await response.json();
      
      if (response.ok) {
        dispatch({ type: 'SET_WORKOUTS', payload: json });
      }
    };
    
    fetchWorkouts();
  }, [dispatch]);

  useEffect(() => {
    if (workouts) {
      // Group workouts by date
      const grouped = workouts.reduce((acc, workout) => {
        const date = new Date(workout.createdAt).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(workout);
        return acc;
      }, {});
      
      setGroupedWorkouts(grouped);
      
      // Set most recent date as selected by default
      const dates = Object.keys(grouped).sort().reverse();
      if (dates.length && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    }
  }, [workouts,selectedDate]);

  return (
    <div className="home">
      <div className="workout-page">
        {/* Date Selection Section */}
        <div className="date-nav">
          <h2>Workout Dates</h2>
          <div className="date-list">
            {Object.keys(groupedWorkouts)
              .sort()
              .reverse()
              .map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`date-button ${selectedDate === date ? 'active' : ''}`}
                >
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                  <span className="workout-count">
                    ({groupedWorkouts[date].length})
                  </span>
                </button>
              ))}
          </div>
        </div>
        
        <div className="workout-content">
          <WorkoutForm />
          <h3>
                Workouts for {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
          {selectedDate && (
            <div className="selected-date-workouts">
              
              <div className="workouts-grid">
                {groupedWorkouts[selectedDate]?.map((workout) => (
                  <WorkoutDetails key={workout._id} workout={workout} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;