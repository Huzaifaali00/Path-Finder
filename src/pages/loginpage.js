// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';


const API_URL = 'https://path-finder-brm0.onrender.com';

function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        if (!email || !password) {
            setError('Please enter both email and password.');
            setIsLoading(false);
            return;
        }
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            if (response.data && response.data.token) {
                onLogin(response.data.token);
                navigate('/dashboard');
            } else {
                setError('Login failed: Invalid response from server.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials or server status.');
            console.error('Login error:', err.response || err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="app-header">
                <h1>Path Finder</h1>
                <p className="tagline">Unlock Your Potential. Your Path Awaits.</p>
            </header>
            <main className="form-card-container">
                <form className="login-form" onSubmit={handleSubmit}>
                    <h2>Welcome Back, Explorer!</h2>
                    <p className="form-subtext">Log in to continue your adventure towards your goals.</p>

                    {error && <p className="message error-message">{error}</p>}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Your Registered Email" // Updated placeholder
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter Your Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {/* --- FORGOT PASSWORD LINK MOVED HERE --- */}
                    <div className="forgot-password-link-container">
                        <Link to="/forgotpassword">Forgot Password?</Link>
                    </div>
                    {/* --- END OF MOVED LINK --- */}

                    <button type="submit" className="action-button" disabled={isLoading}>
                        {isLoading ? <span className="spinner"></span> : 'Log In'}
                    </button>

                    {/* Remaining form links */}
                    <div className="form-links">
                        <span>Don't have an account? </span>
                        <Link to="/signup">Create a new one</Link>
                    </div>
                </form>
            </main>
        </>
    );
}
export default LoginPage;
