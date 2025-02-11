import { useEffect, useState } from "react";
import { useWorkoutConext } from "../hooks/useWorkoutsContext";
import WorkoutDetails from '../components/workoutDetails';
import WorkoutForm from '../components/WorkoutForm';

const Home = () => {
  const { workouts, dispatch } = useWorkoutConext();
  const [selectedDate, setSelectedDate] = useState(null);
  const [groupedWorkouts, setGroupedWorkouts] = useState({});
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);  // Date modal state
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);  // Workout modal state

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
      const grouped = workouts.reduce((acc, workout) => {
        const date = new Date(workout.createdAt).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(workout);
        return acc;
      }, {});

      setGroupedWorkouts(grouped);

      const dates = Object.keys(grouped).sort().reverse();
      if (dates.length && !selectedDate) {
        setSelectedDate(dates[0]);  // Set the first date as selected if no date is selected
      }
    }
  }, [workouts, selectedDate]);

  return (
    <div className="home">
      <div className="workout-page">
        <div className="date-nav">
          <h2>Workout Dates</h2>
          <div className="date-list">
            <button
              className="open-modal-btn"
              onClick={() => setIsDateModalOpen(true)} // Open Date Modal
            >
              Select a Date
            </button>

            {/* Display the list of dates in desktop view */}
            <div className="date-buttons-container">
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
                      day: 'numeric',
                    })}
                    <span className="workout-count">
                      ({groupedWorkouts[date].length})
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>

       {/* Modal for selecting date */}
      {isDateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="close-modal-btn"
              onClick={() => setIsDateModalOpen(false)}
            >
              ✖
            </button>
            <h3>Select a Date</h3>
            <div className="date-buttons-container">
              {Object.keys(groupedWorkouts)
                .sort()
                .reverse()
                .map((date) => (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setIsDateModalOpen(false);
                    }}
                    className={`date-button ${selectedDate === date ? 'active' : ''}`}
                  >
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    <span className="workout-count">
                      ({groupedWorkouts[date].length})
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

        <div className="workout-content">
          {/* Mobile Add Workout Button */}
          <button
            className="open-modal-btn"
            onClick={() => setIsWorkoutModalOpen(true)} // Open Workout Modal
          >
            + Add Workout
          </button>

          {/* Workout Form Inline (Only visible on Web View) */}
          <div className="workout-form-web">
            <WorkoutForm />
          </div>

          {/* Workout Form Modal (Only for Mobile) */}
          {isWorkoutModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button
                  className="close-modal-btn"
                  onClick={() => setIsWorkoutModalOpen(false)}
                >
                  ✖
                </button>
                <WorkoutForm />
              </div>
            </div>
          )}

          <h3>
             {/* Display date data */}
            Workouts for {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
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
