// src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'https://path-finder-brm0.onrender.com/api';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    // const [message, setMessage] = useState(''); // We can primarily use toasts for feedback
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate(); // Initialize useNavigate

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setMessage(''); // Clear local message if you were using it
        setIsLoading(true);
        if (!email) {
            toast.error("Please enter your email address.");
            setIsLoading(false);
            return;
        }
        try {
            const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
            toast.success(response.data.message);
            // *** NEW: Navigate to ResetPasswordPage, passing email as state or query param ***
            navigate(`/resetpassword?email=${encodeURIComponent(email)}`); // Pass email in URL
            // Or, if you prefer to pass it via route state (less visible in URL):
            // navigate('/reset-password', { state: { email: email } });
            // setEmail(''); // No need to clear email if navigating away
        } catch (err) {
            const errorMsg = err.response?.data?.message || "An error occurred. Please try again.";
            // setMessage(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="app-header">
                <h1>Path Finder</h1>
                <p className="tagline">Recover Your Path</p>
            </header>
            <main className="form-card-container">
                <form className="login-form" onSubmit={handleSubmit}>
                    <h2>Forgot Your Password?</h2>
                    <p className="form-subtext">
                        Enter your registered email address to get the Verification code.
                    </p>
                    {/* {message && ( // You can keep this if you want a persistent message on this page too
            <p className={`message ${message.toLowerCase().includes('error') ? 'error-message' : 'success-message'}`}>
                {message}
            </p>
          )} */}
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="your.email@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="action-button" disabled={isLoading}>
                        {isLoading ? <span className="spinner"></span> : 'Send Reset Code'}
                    </button>
                    <div className="form-links">
                        <Link to="/login">Back to Login</Link>
                        <span>|</span>
                        <Link to="/signup">Create New Account</Link>
                    </div>
                </form>
            </main>
        </>
    );
}
export default ForgotPasswordPage;
