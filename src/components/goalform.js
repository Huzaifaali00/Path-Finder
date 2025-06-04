// src/components/GoalForm.js
import React, { useState } from 'react';

function GoalForm({ onAddGoal, isLoading }) {
    const [goalText, setGoalText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!goalText.trim()) return;
        onAddGoal(goalText);
        setGoalText('');
    };

    return (
        <form onSubmit={handleSubmit} className="goal-form content-box"> {/* Added content-box class */}
            <input
                type="text"
                placeholder="What's your next aspiration?"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                disabled={isLoading}
            />
            <button type="submit" className="action-button" disabled={isLoading}>
                {isLoading ? <span className="spinner"></span> : 'Add Goal'}
            </button>
        </form>
    );
}
export default GoalForm;