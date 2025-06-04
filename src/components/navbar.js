// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Make sure your CSS for .switch, .slider is globally available (in App.css)
// or import specific Navbar CSS if you have one.

function Navbar({ onLogout, remindersEnabled, onReminderToggle }) { // Receive new props
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <nav className="app-navbar">
      <Link to="/dashboard" className="nav-brand">Path Finder</Link>
      <div className="nav-links">
        
        {/* --- NEW: Reminder Toggle in Navbar --- */}
        <div className="navbar-reminder-toggle">
          <label htmlFor="navReminderToggle" className="sr-only">Goal Reminders</label> {/* For screen readers */}
          <label className="switch">
            <input 
              type="checkbox" 
              id="navReminderToggle" // Unique ID for this toggle
              checked={remindersEnabled} 
              onChange={onReminderToggle} 
            />
            <span className="slider round"></span>
          </label>
          <span className="reminder-status">{remindersEnabled ? 'Reminders ON' : 'Reminders OFF'}</span>
        </div>
        {/* --- END OF NEW Reminder Toggle --- */}

        <button onClick={handleLogoutClick} className="nav-button logout-button">Logout</button>
      </div>
    </nav>
  );
}
export default Navbar;