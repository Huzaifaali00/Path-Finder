// src/pages/GoalTrackerPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

function GoalTrackerPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(''); // For displaying a general error on the page

  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalDuration, setNewGoalDuration] = useState('');
  const [newGoalDurationUnit, setNewGoalDurationUnit] = useState('days');

  // getAuthHeaders is stable because localStorage is outside React's render cycle
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('authToken');
    // console.log("DEBUG: Token from localStorage in getAuthHeaders:", token);
    if (!token) {
      console.error("GoalTrackerPage: No auth token found for API call.");
      //setError("Authentication error. Please log in again."); // Avoid setting state here if it causes re-renders leading to loops
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []); // Empty dependency array makes this function stable

  const fetchGoals = useCallback(async () => {
    console.log("GoalTrackerPage: Attempting to fetch goals..."); // LOG 1
    setIsLoading(true);
    setError('');

    const authConfig = getAuthHeaders();
    if (!authConfig) {
      setError("Authentication error. Please log in again."); // Set error if no token
      setIsLoading(false);
      setGoals([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/goals`, authConfig);
      console.log("GoalTrackerPage: Goals fetched from backend:", response.data); // LOG 2
      setGoals(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('GoalTrackerPage: Fetch goals API error object:', err); // LOG 3A
      let errorMessage = 'Failed to load goals. Please try again.';
      if (err.response) {
        console.error('GoalTrackerPage: Fetch goals error response data:', err.response.data); // LOG 3B
        console.error('GoalTrackerPage: Fetch goals error status:', err.response.status); // LOG 3C
        errorMessage = err.response.data.message || `Failed to load goals. Status: ${err.response.status}`;
      } else if (err.request) {
        console.error('GoalTrackerPage: Fetch goals error - No response received:', err.request); // LOG 3D
        errorMessage = 'Failed to load goals. No response from server.';
      } else {
        console.error('GoalTrackerPage: Fetch goals error - Request setup issue:', err.message); // LOG 3E
        errorMessage = 'Failed to load goals. Error in request setup.';
      }
      setError(errorMessage); // Set error state here
      toast.error(errorMessage);
      setGoals([]);
    } finally {
      setIsLoading(false);
      console.log("GoalTrackerPage: Finished attempting to fetch goals."); // LOG 4
    }
  }, [getAuthHeaders]); // getAuthHeaders is the only dependency here now

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]); // This runs fetchGoals once on mount and if fetchGoals reference changes

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) {
      toast.warn("Goal text cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    setError(''); // Clear previous page-level errors
    const authConfig = getAuthHeaders();
    if (!authConfig) {
      setIsSubmitting(false);
      toast.error("Authentication error. Please log in again.");
      return;
    }
    try {
      const goalData = { text: newGoalText.trim() };
      const parsedDuration = parseInt(newGoalDuration);
      if (newGoalDuration && !isNaN(parsedDuration) && parsedDuration > 0) {
        goalData.duration = parsedDuration;
        goalData.durationUnit = newGoalDurationUnit;
      }
      // console.log("Frontend: Sending this goalData to backend:", goalData);
      const response = await axios.post(`${API_URL}/goals`, goalData, authConfig);
      // Instead of prepending, re-fetch to get the latest list from server (more robust)
      // setGoals((prevGoals) => [response.data.goal, ...prevGoals]); 
      fetchGoals(); // Re-fetch goals to include the new one and any other server-side changes
      setNewGoalText('');
      setNewGoalDuration('');
      setNewGoalDurationUnit('days');
      toast.success("Goal added to your path!");
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add goal.';
      toast.error(errorMessage); // Show specific error for add goal
      console.error('Add goal error:', err.response || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // handleToggleComplete and handleDeleteGoal can remain similar, 
  // but also consider re-fetching goals on success for consistency.
  const handleToggleComplete = async (goalId) => {
    // ... (optimistic update can stay)
    const originalGoals = [...goals]; // Keep for rollback
    setGoals(prevGoals => prevGoals.map(goal => goal._id === goalId ? { ...goal, completed: !goal.completed } : goal));

    const authConfig = getAuthHeaders();
    if (!authConfig) {
      setGoals(originalGoals); toast.error("Authentication error."); return;
    }
    try {
      await axios.put(`${API_URL}/goals/${goalId}/toggle`, {}, authConfig);
      toast.info(`Goal status updated!`);
      fetchGoals(); // Re-fetch for consistency
    } catch (err) {
      toast.error('Failed to update goal status.');
      setGoals(originalGoals);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    const originalGoals = [...goals];
    setGoals(prevGoals => prevGoals.filter(goal => goal._id !== goalId));
    const authConfig = getAuthHeaders();
    if (!authConfig) {
      setGoals(originalGoals); toast.error("Authentication error."); return;
    }
    try {
      await axios.delete(`${API_URL}/goals/${goalId}`, authConfig);
      toast.success('Goal removed successfully!');
      // No need to call fetchGoals() here if optimistic delete is sufficient
      // OR call fetchGoals() if you want to be absolutely sure UI matches backend
    } catch (err) {
      toast.error('Failed to delete goal. Reverting.');
      setGoals(originalGoals);
    }
  };

  // ... (rest of JSX: loading state, form, error display, empty state, goals.map) ...
  // Ensure the error display is clear:
  // {error && !isSubmitting && <p className="message error-message form-error-message">{error}</p>}

  return (
    <div className="goal-tracker-container feature-page-container">
      <header className="feature-header">
        <h2>My Goal Tracker</h2>
        <p>Define your aspirations and track your progress towards a fulfilling future.</p>
      </header>

      <form onSubmit={handleAddGoal} className="goal-form content-box">
        {/* Form inputs for newGoalText, newGoalDuration, newGoalDurationUnit */}
        <div className="form-group">
          <label htmlFor="newGoalText">New Goal:</label>
          <input type="text" id="newGoalText" placeholder="What's your next aspiration?" value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)} disabled={isSubmitting} required />
        </div>
        <div className="form-group">
          <label htmlFor="newGoalDuration">Time Duration (Optional):</label>
          <div className="duration-group">
            <input type="number" id="newGoalDuration" placeholder="e.g., 7" value={newGoalDuration} onChange={(e) => setNewGoalDuration(e.target.value)} min="1" disabled={isSubmitting} />
            <select id="newGoalDurationUnit" value={newGoalDurationUnit} onChange={(e) => setNewGoalDurationUnit(e.target.value)} disabled={isSubmitting || !newGoalDuration} >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        </div>
        <button type="submit" className="action-button" disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner"></span> : 'Add Goal to Path'}
        </button>
      </form>

      {error && !isSubmitting && <p className="message error-message form-error-message">{error}</p>}

      {isLoading && goals.length === 0 && (
        <div className="loading-container"><span className="page-spinner"></span><p>Loading your goals...</p></div>
      )}

      {!isLoading && goals.length === 0 && !error && ( // Show empty state only if not loading and no error
        <div className="empty-state content-box">
          <h3>No Goals Charted Yet!</h3>
          <p>Every great journey starts with a first step. Add a goal to begin!</p>
        </div>
      )}

      <div className="goal-list">
        {goals.map((goal) => (
          <div key={goal._id} className={`goal-item content-box ${goal.completed ? 'completed' : ''}`}>
            <input type="checkbox" checked={!!goal.completed} onChange={() => handleToggleComplete(goal._id)} id={`goal-checkbox-${goal._id}`} aria-labelledby={`goal-text-${goal._id}`} />
            <div className="goal-details">
              <label htmlFor={`goal-checkbox-${goal._id}`} id={`goal-text-${goal._id}`} className="goal-text">
                {goal.text}
              </label>
              {goal.duration && goal.durationUnit && (
                <span className="goal-duration-display">
                  Target: {goal.duration} {goal.durationUnit}
                </span>
              )}
            </div>
            <button onClick={() => handleDeleteGoal(goal._id)} className="delete-button" aria-label="Delete goal">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default GoalTrackerPage;