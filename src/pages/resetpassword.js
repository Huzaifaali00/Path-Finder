// src/pages/ResetPasswordPage.js
import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'https://path-finder-brm0.onrender.com/api';
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^_\-.()[\]{},;<>:/\\^"])[A-Za-z\d@$!%*#?&^_\-.()[\]{},;<>:/\\^"]{8,12}$/;


function ResetPasswordPage() {
    const [searchParams] = useSearchParams(); // To get token from URL if using token link method
    const [email, setEmail] = useState(searchParams.get('email') || ''); // Pre-fill if email in URL
    const [code, setCode] = useState(searchParams.get('token') || ''); // Or 'code' if you name it so
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const validatePasswordField = (currentPassword) => {
        if (currentPassword && !PASSWORD_REGEX.test(currentPassword)) {
            setPasswordError("8-12 chars; incl. letter, digit, special char.");
        } else {
            setPasswordError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        validatePasswordField(newPassword); // Validate before submit

        if (!email || !code || !newPassword || !confirmPassword) {
            setError('All fields are required.');
            setIsLoading(false);
            return;
        }
        if (passwordError || !PASSWORD_REGEX.test(newPassword)) {
            setError(passwordError || "New password does not meet criteria.");
            setIsLoading(false);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/reset-password`, {
                email,
                code,
                newPassword,
                confirmPassword
            });
            toast.success(response.data.message || "Password reset successfully! Please login.");
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Failed to reset password. Please try again.";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="app-header">
                <h1>Path Finder</h1>
                <p className="tagline">Forge a New Key to Your Path</p>
            </header>
            <main className="form-card-container">
                <form className="login-form" onSubmit={handleSubmit}> {/* Can reuse login-form class */}
                    <h2>Reset Your Password</h2>
                    <p className="form-subtext">Enter the code sent to your email and your new password.</p>
                    {error && <p className="message error-message">{error}</p>}
                    <div className="form-group">
                        <label htmlFor="email">Your Registered Email</label>
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
                    <div className="form-group">
                        <label htmlFor="code">Verification Code</label>
                        <input
                            type="text"
                            id="code"
                            placeholder="Enter 6-digit code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            placeholder="8-12 chars (letter, digit, special)"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                validatePasswordField(e.target.value);
                            }}
                            onBlur={() => validatePasswordField(newPassword)}
                            required
                            disabled={isLoading}
                        />
                        {passwordError && newPassword.length > 0 && (
                            <p className="message error-message inline-field-error">{passwordError}</p>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="Confirm your new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="action-button" disabled={isLoading}>
                        {isLoading ? <span className="spinner"></span> : 'Reset Password'}
                    </button>
                    <div className="form-links">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </form>
            </main>
        </>
    );
}
export default ResetPasswordPage;
