// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Page Components (we'll create these next)
import LoginPage from './pages/loginpage';
import SignupPage from './pages/signup';
import DashboardPage from './pages/dashboard';
import VisionBoardPage from './pages/visionboard';
import GoalTrackerPage from './pages/goaltracker';
import Navbar from './components/navbar';
import ForgotPasswordPage from './pages/forgotpassword'; // NEW
import ResetPasswordPage from './pages/resetpassword';  // We'll create this

// Auth helper functions
const getAuthToken = () => localStorage.getItem('authToken');
const setAuthToken = (token) => localStorage.setItem('authToken', token);
const removeAuthToken = () => localStorage.removeItem('authToken');

// Helper component to manage app-container class based on route
function AppLayout({ isAuthenticated, children }) {
  const location = useLocation();
  const authRoutes = ['/login', '/signup', '/forgotpassword', '/resetpassword'];
  const shouldCenterContent = authRoutes.includes(location.pathname) && !isAuthenticated;

  return (
    <div className={`app-container ${shouldCenterContent ? 'center-content' : ''}`}>
      {children}
    </div>
  );
}


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());

  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    const savedPreference = localStorage.getItem('goalRemindersEnabled');
    return savedPreference !== null ? JSON.parse(savedPreference) : true;
  });

  const handleLogin = (token) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    // Optionally store user info from login response if needed globally
    // const userInfo = response.data.user; // Assuming login response has user details
    // localStorage.setItem('userInfo', JSON.stringify(userInfo));
  };

  const handleLogout = () => {
    removeAuthToken();
    // localStorage.removeItem('userInfo'); // Clear user info on logout
    setIsAuthenticated(false);
    toast.info("You have been logged out.");
  };

  const handleReminderToggle = () => {
    const newPreference = !remindersEnabled;
    setRemindersEnabled(newPreference);
    localStorage.setItem('goalRemindersEnabled', JSON.stringify(newPreference));
    if (newPreference) {
      toast.success("Goal reminders ON!");
    } else {
      toast.warn("Goal reminders OFF.");
    }
  };

  // ProtectedRoute component remains the same
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      {isAuthenticated && (
        <Navbar
          onLogout={handleLogout}
          remindersEnabled={remindersEnabled}
          onReminderToggle={handleReminderToggle}
        />
      )}
      {/* Use AppLayout to conditionally apply 'center-content' class */}
      <AppLayout isAuthenticated={isAuthenticated}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
          <Route path="/resetpassword" element={<ResetPasswordPage />} /> {/* Can also be /reset-password/:token */}

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage remindersEnabled={remindersEnabled} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vision-board"
            element={<ProtectedRoute><VisionBoardPage /></ProtectedRoute>}
          />
          <Route
            path="/goal-tracker"
            element={<ProtectedRoute><GoalTrackerPage /></ProtectedRoute>}
          />

          {/* Default route handling */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />
          {/* Catch-all for unknown routes */}
          <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      </AppLayout>
      <ToastContainer
        position="bottom-right" // Changed position for less overlap with navbar potentially
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // Or your preferred theme: "light", "dark"
      />
    </Router>
  );
}
export default App;