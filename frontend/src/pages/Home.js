import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkoutConext } from "../hooks/useWorkoutsContext";
import WorkoutForm from '../components/WorkoutForm';

const Home = () => {
  const { workouts, dispatch } = useWorkoutConext();
  const navigate = useNavigate();

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

  const handleViewDashboard = () => {
    navigate('/dashboard');
  };

  // Calculate some workout stats for the home page
  const calculateStats = () => {
    if (!workouts) return { total: 0, categories: {}, recentDate: null };
    
    const stats = {
      total: workouts.length,
      categories: {},
      recentDate: null
    };
    
    // Get counts by category
    workouts.forEach(workout => {
      if (!stats.categories[workout.category]) {
        stats.categories[workout.category] = 0;
      }
      stats.categories[workout.category]++;
      
      // Track most recent workout date
      const date = new Date(workout.createdAt);
      if (!stats.recentDate || date > stats.recentDate) {
        stats.recentDate = date;
      }
    });
    
    return stats;
  };
  
  const stats = calculateStats();
  
  return (
    <div className="home">
      <div className="home-content">
        <div className="welcome-section">
          <h1>Workout Tracker</h1>
          <p>Track your fitness journey and monitor your progress over time.</p>
          
          {stats.total > 0 && (
            <div className="workout-stats">
              <h3>Your Stats</h3>
              <p>Total Workouts: {stats.total}</p>
              {stats.recentDate && (
                <p>Last Workout: {stats.recentDate.toLocaleDateString()}</p>
              )}
              <div className="category-stats">
                {Object.entries(stats.categories).map(([category, count]) => (
                  <div key={category} className="category-stat">
                    <span className="category-name">{category}</span>
                    <span className="category-count">{count} workouts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="action-buttons">
            <button 
              className="primary-btn" 
              onClick={handleViewDashboard}
            >
              View Dashboard
            </button>
          </div>
        </div>
        
        <div className="workout-form-container">
          <WorkoutForm />
        </div>
      </div>
    </div>
  );
};

export default Home;