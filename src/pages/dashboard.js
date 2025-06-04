// src/pages/DashboardPage.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'https://path-finder-brm0.onrender.com';

// Receive remindersEnabled as a prop from App.js
function DashboardPage({ remindersEnabled }) {
    const [userName] = useState('Pathfinder'); // Keeping this local for now
    const [currentQuote, setCurrentQuote] = useState({
        text: "The journey of a thousand miles begins with a single step.",
        author: "Lao Tzu"
    });

    const motivationalQuotes = useMemo(() => [
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Act as if what you do makes a difference. It does.", author: "William James" },
        { text: "Your limitation—it's only your imagination.", author: "Napoleon Hill" },
        { text: "Push yourself, because no one else is going to do it for you.", author: "Rhyanna Watson" },
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" }
    ], []);

    const [stats, setStats] = useState({
        activeGoals: '...',
        completedGoals: '...',
        visionItems: '...',
    });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [activeGoalsList, setActiveGoalsList] = useState([]);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error("DashboardPage: No auth token found for API call.");
            return null;
        }
        return { headers: { Authorization: `Bearer ${token}` } };
    }, []);

    useEffect(() => { // For quote
        if (motivationalQuotes.length > 0) {
            const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
            setCurrentQuote(motivationalQuotes[randomIndex]);
        }
    }, [motivationalQuotes]);

    // useEffect to fetch dashboard stats AND populate activeGoalsList
    useEffect(() => {
        const fetchDashboardData = async () => {
            console.log("DashboardPage: Attempting to fetch dashboard data (stats & active goals)...");
            setIsLoadingStats(true);
            const authConfig = getAuthHeaders();

            if (!authConfig) {
                console.warn("DashboardPage: Cannot fetch data, no auth token.");
                setStats({ activeGoals: 0, completedGoals: 0, visionItems: 0 });
                setActiveGoalsList([]);
                setIsLoadingStats(false);
                return;
            }

            try {
                const [goalsResponse, visionResponse] = await Promise.all([
                    axios.get(`${API_URL}/goals`, authConfig),
                    axios.get(`${API_URL}/visionboard`, authConfig)
                ]);

                const goalsData = Array.isArray(goalsResponse.data) ? goalsResponse.data : [];
                const visionData = Array.isArray(visionResponse.data) ? visionResponse.data : [];

                const currentActiveGoals = goalsData.filter(g => !g.completed);
                setStats({
                    activeGoals: currentActiveGoals.length,
                    completedGoals: goalsData.filter(g => g.completed).length,
                    visionItems: visionData.length
                });
                setActiveGoalsList(currentActiveGoals);

            } catch (error) {
                console.error("Error fetching dashboard data:", error.response?.data?.message || error.message);
                setStats({ activeGoals: 'N/A', completedGoals: 'N/A', visionItems: 'N/A' });
                setActiveGoalsList([]);
            } finally {
                setIsLoadingStats(false);
                console.log("DashboardPage: Finished fetching dashboard data.");
            }
        };

        fetchDashboardData();
    }, [getAuthHeaders]); 


    useEffect(() => {
        let reminderIntervalId = null;
        if (remindersEnabled && activeGoalsList.length > 0) {
            console.log("DashboardPage: Prop remindersEnabled is ON. Setting up reminders. Active goals:", activeGoalsList.length);

            const showReminder = () => {
                if (activeGoalsList.length > 0) {
                    const randomActiveGoal = activeGoalsList[Math.floor(Math.random() * activeGoalsList.length)];
                    const randomMotivationalLine = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)].text;
                    toast.info(
                        <div>
                            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>🎯 Goal Reminder!</p>
                            <p>Keep focus on: "<strong>{randomActiveGoal.text}</strong>"</p>
                            <p style={{ fontStyle: 'italic', marginTop: '5px', fontSize: '0.9em' }}>{randomMotivationalLine}</p>
                        </div>,
                        { autoClose: 6000, position: "bottom-right", toastId: `goal-reminder-${randomActiveGoal._id || Date.now()}` }
                    );
                } else {
                    if (reminderIntervalId) clearInterval(reminderIntervalId);
                }
            };
            showReminder(); // Immediate reminder
            reminderIntervalId = setInterval(showReminder, 60000); // 1 minute
            console.log("DashboardPage: Reminder interval SET with ID:", reminderIntervalId);
        } else {
            console.log("DashboardPage: Prop remindersEnabled is OFF or no active goals. Interval not set or will be cleared.");
        }

        return () => { // Cleanup function
            if (reminderIntervalId) {
                clearInterval(reminderIntervalId);
                console.log("DashboardPage: Reminder interval CLEARED with ID:", reminderIntervalId);
            }
        };
    }, [remindersEnabled, activeGoalsList, motivationalQuotes]); // Depends on the prop now

    // The handleReminderToggle function is REMOVED from here (moved to App.js)

    return (
        <div className="dashboard-container feature-page-container">
            <header className="feature-header">
                <h1>Welcome, {userName}!</h1>
                <p className="page-intro-text">
                    Today is a new opportunity to shape your destiny. Your Path Finder dashboard is ready to guide you.
                </p>
            </header>

            {/* Reminder Toggle UI is REMOVED from here (it's in Navbar.js) */}

            <nav className="dashboard-nav">
                <Link to="/vision-board" className="dashboard-link">
                    <h3>My Vision Board</h3>
                    <p>Visualize & Manifest</p>
                </Link>
                <Link to="/goal-tracker" className="dashboard-link">
                    <h3>My Goal Tracker</h3>
                    <p>Define & Conquer</p>
                </Link>
            </nav>
            <section className="motivational-reminder-placeholder content-box">
                <h3>Cosmic Insight</h3>
                <blockquote>
                    <p>"{currentQuote.text}"</p>
                    {currentQuote.author && <footer>— {currentQuote.author}</footer>}
                </blockquote>
            </section>
            <section className="dashboard-widgets">
                <div className="widget-card content-box">
                    <h3>Your Progress</h3>
                    {isLoadingStats ? (
                        <p>Loading stats...</p>
                    ) : (
                        <>
                            <p>Active Goals: <strong>{stats.activeGoals}</strong></p>
                            <p>Completed Goals: <strong>{stats.completedGoals}</strong></p>
                            <p>Vision Board Stars: <strong>{stats.visionItems}</strong></p>
                        </>
                    )}
                    <p className="widget-footer-text">Keep exploring and achieving!</p>
                </div>
                <div className="widget-card content-box next-steps-widget">
                    <h3>Next Steps on Your Path</h3>
                    <ul>
                        <li><Link to="/goal-tracker">Chart a new goal or update progress</Link><span>Define your next milestone.</span></li>
                        <li><Link to="/vision-board">Add a new star to your vision board</Link><span>Keep your inspirations vibrant.</span></li>
                    </ul>
                    <p className="widget-footer-text">Every step forward is progress!</p>
                </div>
            </section>
            {/* ToastContainer should be in App.js for app-wide notifications */}
        </div>
    );
}
export default DashboardPage;
