import { useEffect, useState } from "react";
import { useWorkoutConext } from "../hooks/useWorkoutsContext";
import WorkoutDetails from '../components/workoutDetails';
import WorkoutForm from '../components/WorkoutForm';

const Home = () => {
  const { workouts, dispatch } = useWorkoutConext();
  const [selectedDate, setSelectedDate] = useState(null);
  const [groupedWorkouts, setGroupedWorkouts] = useState({});
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [calendarDates, setCalendarDates] = useState(new Set());


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
      setCalendarDates(new Set(Object.keys(grouped)));

      const dates = Object.keys(grouped).sort().reverse();
      if (dates.length && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    }
  }, [workouts, selectedDate]);

  const CalendarPicker = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      return { daysInMonth, firstDayOfMonth };
    };

    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentMonth);

    const handlePrevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const formatDateString = (day) => {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      return `${year}-${month}-${dayStr}`;
    };
    return (
      <div className="calendar-picker">
        <div className="calendar-header">
          <button 
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
          >
            ←
          </button>
          <h3 className="calendar-month-title">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            className="calendar-nav-btn"
            onClick={handleNextMonth}
          >
            →
          </button>
        </div>
        
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>
        
        <div className="calendar-grid">
          {[...Array(firstDayOfMonth)].map((_, index) => (
            <div key={`empty-${index}`} />
          ))}
          
          {[...Array(daysInMonth)].map((_, index) => {
            const day = index + 1;
            const dateString = formatDateString(day);
            const hasWorkouts = calendarDates.has(dateString);
            const isSelected = selectedDate === dateString;
            
            return (
              <button
                key={day}
                onClick={() => {
                  if (hasWorkouts) {
                    setSelectedDate(dateString);
                    setIsDateModalOpen(false);
                  }
                }}
                className={`calendar-day ${hasWorkouts ? 'has-workouts' : ''} ${isSelected ? 'selected' : ''}`}
                disabled={!hasWorkouts}
              >
                {day}
                {hasWorkouts && !isSelected && (
                  <span className="workout-indicator" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="home">
      <div className="workout-page">
        <div className="date-nav">
          <h2>Workout Dates</h2>
          <div className="date-list">
            <button
              className="open-modal-btn"
              onClick={() => setIsDateModalOpen(true)}
            >
              Select a Date
            </button>

            <div className="date-buttons-container hidden md:block">
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
              <CalendarPicker />
            </div>
          </div>
        )}

        <div className="workout-content">
          <button
            className="open-modal-btn"
            onClick={() => setIsWorkoutModalOpen(true)}
          >
            + Add Workout
          </button>

          <div className="workout-form-web">
            <WorkoutForm />
          </div>

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