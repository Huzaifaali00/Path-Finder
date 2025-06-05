// src/pages/SignupPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'https://path-finder-brm0.onrender.com/api';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^_\-.()[\]{},;<>:/\\^"])[A-Za-z\d@$!%*#?&^_\-.()[\]{},;<>:/\\^"]{8,12}$/;

function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(''); // For general form error display after submit attempt
    const [emailError, setEmailError] = useState(''); // Inline error for email
    const [passwordError, setPasswordError] = useState(''); // Inline error for password

    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Inline validation as user types or blurs
    const validateEmailField = (currentEmail) => {
        if (currentEmail && !EMAIL_REGEX.test(currentEmail)) {
            setEmailError("Must be a valid @gmail.com address.");
        } else {
            setEmailError('');
        }
    };

    const validatePasswordField = (currentPassword) => {
        if (currentPassword && !PASSWORD_REGEX.test(currentPassword)) {
            setPasswordError("8-12 chars; incl. letter, digit, special char.");
        } else {
            setPasswordError('');
        }
    };

    const validateFormOnSubmit = () => {
        // Clear general error before re-validating
        setError('');
        // Ensure inline errors are also up-to-date based on current values
        validateEmailField(email);
        validatePasswordField(password);

        if (!fullName || !email || !password || !confirmPassword) {
            setError("All fields are required to begin your quest.");
            return false;
        }
        if (emailError || !EMAIL_REGEX.test(email)) { // Check inline error OR regex test
            setError(emailError || "Invalid email format. Must be a @gmail.com address.");
            return false;
        }
        if (passwordError || !PASSWORD_REGEX.test(password)) { // Check inline error OR regex test
            setError(passwordError || "Password must be 8-12 characters, with a letter, digit, & special char.");
            return false;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match. Please re-enter carefully.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateFormOnSubmit()) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        // setError(''); // Already cleared in validateFormOnSubmit

        try {
            const response = await axios.post(`${API_URL}/auth/signup`, { fullName, email, password });
            toast.success(response.data.message || 'Signup successful! Please login.');
            setFullName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setEmailError(''); // Clear inline errors on success
            setPasswordError('');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Signup failed. An obstacle appeared on the path.';
            setError(errorMessage); // Display backend error or generic one
            toast.error(errorMessage);
            console.error('Signup error:', err.response || err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="app-header">
                <h1>Path Finder</h1>
                <p className="tagline">Begin Your Journey. Define Your Destiny.</p>
            </header>
            <main className="form-card-container">
                <form className="signup-form" onSubmit={handleSubmit}>
                    <h2>Start Your Journey Now!</h2>
                    <p className="form-subtext">Create your account to start manifesting your visions and tracking your goals.</p>

                    {error && <p className="message error-message">{error}</p>}

                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            placeholder="Your Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email Address (@gmail.com only)</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="your.name@gmail.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                validateEmailField(e.target.value); // Validate on change
                            }}
                            onBlur={() => validateEmailField(email)} // Validate on blur (when user clicks away)
                            required
                            disabled={isLoading}
                        />
                        {/* --- INLINE EMAIL ERROR MESSAGE --- */}
                        {emailError && email.length > 0 && (
                            <p className="message error-message inline-field-error">{emailError}</p>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="8-12 chars (letter, digit, special)"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                validatePasswordField(e.target.value); // Validate on change
                            }}
                            onBlur={() => validatePasswordField(password)} // Validate on blur
                            required
                            disabled={isLoading}
                        />
                        {/* --- INLINE PASSWORD ERROR MESSAGE --- */}
                        {passwordError && password.length > 0 && (
                            <p className="message error-message inline-field-error">{passwordError}</p>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="Confirm Your Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="action-button" disabled={isLoading}>
                        {isLoading ? <span className="spinner"></span> : 'Sign Up'}
                    </button>
                    <div className="form-links">
                        <span>Already a user?</span>
                        <Link to="/login">Log in</Link>
                    </div>
                </form>
            </main>
        </>
    );
}
export default SignupPage;
