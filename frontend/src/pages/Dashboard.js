// pages/Dashboard.js - Updated with side-by-side layout and improved CategoryLegend
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ExerciseProgressDashboard from '../components/ExerciseProgressDashboard';
import WorkoutDetails from '../components/workoutDetails';
import { useWorkoutConext } from '../hooks/useWorkoutsContext';

const Dashboard = () => {
  const { workouts, dispatch } = useWorkoutConext();
  const location = useLocation();
  
  // States for workout display
  const [selectedDate, setSelectedDate] = useState(null);
  const [groupedWorkouts, setGroupedWorkouts] = useState({});
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [calendarDates, setCalendarDates] = useState(new Set());
  
  // States for progress display
  const [preSelectedExercise, setPreSelectedExercise] = useState(null);
  const [preSelectedCategory, setPreSelectedCategory] = useState(null);
  const [preSelectedType, setPreSelectedType] = useState(null);
  const [showProgressView, setShowProgressView] = useState(false);

  // Category colors for both workout types
  const categoryColors = {
    // Weight training categories
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

  // Helper function to get categories for a specific date
  const getCategoriesForDate = (dateString) => {
    if (!groupedWorkouts[dateString]) return [];
    const categories = new Set(
      groupedWorkouts[dateString].map(workout => workout.category)
    );
    return Array.from(categories);
  };

  // Extract URL parameters on component mount or URL change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const exercise = searchParams.get('exercise');
    const category = searchParams.get('category');
    const type = searchParams.get('type') || 'weights';
    
    if (exercise && category) {
      setPreSelectedExercise(exercise);
      setPreSelectedCategory(category);
      setPreSelectedType(type);
      setShowProgressView(true);
    } else {
      setShowProgressView(false);
    }
  }, [location.search]);

  // Fetch workouts when component mounts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch('/api/workouts');
        const json = await response.json();

        if (response.ok) {
          dispatch({ type: 'SET_WORKOUTS', payload: json });
        }
      } catch (error) {
        console.error('Error fetching workouts:', error);
      }
    };

    fetchWorkouts();
  }, [dispatch]);

  // Process and group workouts by date
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
                  <div className="category-indicators">
                    {getCategoriesForDate(dateString).map(category => (
                      <span 
                        key={category} 
                        className="category-indicator" 
                        style={{ backgroundColor: categoryColors[category] }}
                        title={category}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Function to go back to workouts view from progress view
  const handleBackToWorkouts = () => {
    // Remove exercise and category from URL without navigating
    const url = new URL(window.location);
    url.searchParams.delete('exercise');
    url.searchParams.delete('category');
    url.searchParams.delete('type');
    window.history.pushState({}, '', url);
    
    setShowProgressView(false);
    setPreSelectedExercise(null);
    setPreSelectedCategory(null);
    setPreSelectedType(null);
  };

  // Create an improved legend for the category colors with separate sections
  const CategoryLegend = () => {
    // Separate weight and cardio categories for better organization
    const weightCategories = ['Legs', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core'];
    const cardioCategories = ['Running', 'Cycling', 'Swimming', 'Rowing', 'Elliptical'];
    
    return (
      <div className="legend-container">
        <div className="legend-section">
          <h4 className="legend-title">Weights</h4>
          <div className="category-legend">
            {weightCategories.map(category => (
              <div key={category} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ backgroundColor: categoryColors[category] }}
                ></span>
                <span>{category}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="legend-section">
          <h4 className="legend-title">Cardio</h4>
          <div className="category-legend">
            {cardioCategories.map(category => (
              <div key={category} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ backgroundColor: categoryColors[category] }}
                ></span>
                <span>{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      {showProgressView ? (
        <>
          <button 
            className="back-button"
            onClick={handleBackToWorkouts}
          >
            ← Back to Workouts
          </button>
          <h1>Exercise Progress</h1>
          <ExerciseProgressDashboard 
            key={`${preSelectedCategory}-${preSelectedExercise}-${preSelectedType}`}
            preSelectedExercise={preSelectedExercise}
            preSelectedCategory={preSelectedCategory}
            preSelectedType={preSelectedType}
          />
        </>
      ) : (
        <div className="workouts-dashboard">
          <h1>Your Workout Dashboard</h1>
          
          <div className="dashboard-layout">
            <div className="date-nav"> 
              <CategoryLegend />
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
                <div className="modal-content calendar-modal">
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
              <h3>
                Workouts for {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
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
      )}
    </div>
  );
};

export default Dashboard;