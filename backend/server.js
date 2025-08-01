// pathfinder-backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { put } = require('@vercel/blob'); // <-- 1. ADD THIS IMPORT
const sendEmail = require('./utils/sendemail');
require('dotenv').config(); // Load environment variables

// Import Models
const User = require('./models/User');
const Goal = require('./models/Goal');
const VisionBoardItem = require('./models/visionboarditem');

// Import Auth Middleware
const authMiddleware = require('./middleware/authmiddleware');

const app = express();

// --- Regex for Validation ---
const EMAIL_REGEX_SERVER = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const PASSWORD_REGEX_SERVER = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^_\-\.()\[\]{},;<>:\/\\])[A-Za-z\d@$!%*#?&^_\-\.()\[\]{},;<>:\/\\]{8,12}$/;

// --- Database Connection ---
const LOCAL_MONGO_USER = process.env.MONGO_ADMIN_USER;
const LOCAL_MONGO_PASS = process.env.MONGO_ADMIN_PASSWORD;
const DB_NAME = process.env.MONGO_DB_NAME || "pathfinder_db";

const MONGO_URI = process.env.MONGO_CLOUD_URI ||
    `mongodb://${LOCAL_MONGO_USER}:${LOCAL_MONGO_PASS}@localhost:27017/${DB_NAME}?authSource=admin`;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`MongoDB Connected Successfully using URI: ${MONGO_URI.startsWith('mongodb+srv') ? 'Atlas Cloud' : 'Local Instance'} to database "${DB_NAME}"`);
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};
connectDB();

// --- Middleware ---

// ***** FINAL SECURE CORS CONFIGURATION *****
const allowedOrigins = [
    'http://localhost:3000',
    'https://path-finder-frontend-mu.vercel.app' // Your live frontend URL
];
const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // <-- 2. DELETE THIS LINE

// --- API Routes ---
app.get('/', (req, res) => {
    res.send('Path Finder API is running!');
});

// == Authentication Routes (No changes needed) ==
app.post('/api/auth/signup', async (req, res) => {
    console.log('Signup request body:', req.body);
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }
    if (!EMAIL_REGEX_SERVER.test(email)) {
        return res.status(400).json({ message: 'Invalid email format. Must be a @gmail.com address.' });
    }
    if (!PASSWORD_REGEX_SERVER.test(password)) {
        return res.status(400).json({
            message: "Password must be 8-12 characters long and include at least one letter, one digit, and one special character."
        });
    }
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        user = new User({ fullName, email: email.toLowerCase(), password });
        await user.save();
        const userResponse = { _id: user._id, fullName: user.fullName, email: user.email };
        res.status(201).json({ message: 'User registered successfully!', user: userResponse });
    } catch (err) {
        console.error('Signup Server Error:', err.message, err.stack);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email address already registered.' });
        }
        res.status(500).json({ message: 'Server error during signup' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    console.log('Login attempt body:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const payload = { user: { id: user.id, fullName: user.fullName, email: user.email } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ message: 'Login successful!', token, user: { id: user.id, fullName: user.fullName, email: user.email } });
            }
        );
    } catch (err) {
        console.error('Login Server Error:', err.message, err.stack);
        res.status(500).json({ message: 'Server error during login' });
    }
});
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) { return res.status(400).json({ message: 'Email address is required.' }); }
    console.log(`Forgot password request for email: ${email}`);
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log(`Forgot password: User not found for email ${email}.`);
            return res.status(404).json({ message: 'This email address is not registered with Path Finder.' });
        }
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = Date.now() + 3600000; // Code expires in 1 hour
        await user.save();
        const emailSubject = 'Your Path Finder Password Reset Code';
        const emailMessageText = `Hello ${user.fullName},\n\nYou requested a password reset...\nYour code is: ${resetCode}\n...`;
        const emailMessageHtml = `<p>Hello ${user.fullName},</p><p>Your code is: <strong>${resetCode}</strong>...</p>`;
        try {
            await sendEmail({ email: user.email, subject: emailSubject, message: emailMessageText, htmlMessage: emailMessageHtml });
            console.log(`Password reset code successfully sent to ${user.email}`);
            res.status(200).json({ message: 'A password reset code has been sent to your email address.' });
        } catch (emailError) {
            console.error(`Failed to send password reset email to ${user.email}:`, emailError);
            res.status(500).json({ message: 'Could not send reset email. Please try again. (Dev: Check console for code: ' + resetCode + ')' });
        }
    } catch (err) {
        console.error('Forgot Password Server Error:', err.message, err.stack);
        res.status(500).json({ message: 'An error occurred processing your request. Please try again later.' });
    }
});
app.post('/api/auth/reset-password', async (req, res) => {
    const { email, code, newPassword, confirmPassword } = req.body;
    if (!email || !code || !newPassword || !confirmPassword) { return res.status(400).json({ message: 'All fields are required.' }); }
    if (newPassword !== confirmPassword) { return res.status(400).json({ message: 'New passwords do not match.' }); }
    if (!PASSWORD_REGEX_SERVER.test(newPassword)) { return res.status(400).json({ message: "New password must be 8-12 characters long and include at least one letter, one digit, and one special character." }); }
    console.log(`Reset password attempt for email: ${email} with code: ${code}`);
    try {
        const user = await User.findOne({ email: email.toLowerCase(), resetPasswordCode: code, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            console.log("Reset password: Invalid code, expired code, or email not found.");
            return res.status(400).json({ message: 'Invalid or expired password reset code.' });
        }
        user.password = newPassword;
        user.resetPasswordCode = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        console.log(`Password successfully reset for ${user.email}`);
        res.status(200).json({ message: 'Password has been reset successfully. You can now login.' });
    } catch (err) {
        console.error('Reset Password Server Error:', err.message, err.stack);
        res.status(500).json({ message: 'An error occurred while resetting your password.' });
    }
});


// == Goal Routes (No changes needed) ==
app.get('/api/goals', authMiddleware, async (req, res) => {
    console.log(`Backend GET /api/goals - Route hit. User from authMiddleware:`, req.user);
    try {
        if (!req.user || !req.user.id) {
            console.error("User ID not found in request after authMiddleware for GET /api/goals");
            return res.status(401).json({ message: "Authentication error: User not identified." });
        }
        const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
        console.log("Found goals for user " + req.user.id + ":", goals);
        res.json(goals);
    } catch (err) {
        console.error('Backend Fetch goals error:', err.message, err.stack);
        res.status(500).send('Server Error when fetching goals');
    }
});
app.post('/api/goals', authMiddleware, async (req, res) => {
    console.log("Backend POST /api/goals received req.body:", req.body);
    const { text, duration, durationUnit } = req.body;
    if (!text || text.trim() === "") {
        return res.status(400).json({ message: 'Goal text is required' });
    }
    let parsedDuration;
    if (duration !== undefined && duration !== null && duration !== '') {
        parsedDuration = parseInt(duration);
        if (isNaN(parsedDuration) || parsedDuration < 1) {
            return res.status(400).json({ message: 'If duration is provided, it must be a positive number.' });
        }
        if (!durationUnit || !['days', 'weeks', 'months'].includes(durationUnit)) {
            return res.status(400).json({ message: 'If duration is provided, a valid duration unit (days, weeks, months) is required.' });
        }
    } else if (durationUnit) {
        return res.status(400).json({ message: 'Duration value is required if duration unit is provided.' });
    }
    try {
        const newGoalData = { text: text.trim(), user: req.user.id };
        if (parsedDuration && durationUnit) {
            newGoalData.duration = parsedDuration;
            newGoalData.durationUnit = durationUnit;
        }
        console.log("Data for new Goal object:", newGoalData);
        const newGoal = new Goal(newGoalData);
        const goal = await newGoal.save();
        console.log("Goal saved to DB:", goal);
        res.status(201).json({ message: 'Goal created successfully', goal });
    } catch (err) {
        console.error('Create goal error:', err.message, err.stack);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({ message: "Validation Failed", errors });
        }
        res.status(500).json({ message: 'Server Error when creating goal' });
    }
});
app.put('/api/goals/:goalId/toggle', authMiddleware, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.goalId);
        if (!goal) { return res.status(404).json({ message: 'Goal not found' }); }
        if (goal.user.toString() !== req.user.id) { return res.status(403).json({ message: 'User not authorized' }); }
        goal.completed = !goal.completed;
        await goal.save();
        res.json({ message: 'Goal status updated', goal });
    } catch (err) {
        console.error('Toggle goal error:', err.message, err.stack);
        if (err.kind === 'ObjectId') { return res.status(404).json({ message: 'Goal not found (ID format)' }); }
        res.status(500).send('Server Error updating goal');
    }
});
app.delete('/api/goals/:goalId', authMiddleware, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.goalId);
        if (!goal) { return res.status(404).json({ message: 'Goal not found' }); }
        if (goal.user.toString() !== req.user.id) { return res.status(403).json({ message: 'User not authorized' }); }
        await goal.deleteOne();
        res.json({ message: 'Goal removed successfully' });
    } catch (err) {
        console.error('Delete goal error:', err.message, err.stack);
        if (err.kind === 'ObjectId') { return res.status(404).json({ message: 'Goal not found (ID format)' }); }
        res.status(500).send('Server Error deleting goal');
    }
});

// == Vision Board Routes ==
app.get('/api/visionboard', authMiddleware, async (req, res) => {
    try {
        const items = await VisionBoardItem.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        console.error('Fetch vision board items error:', err.message, err.stack);
        res.status(500).send('Server Error fetching vision board items');
    }
});
app.post('/api/visionboard/quote', authMiddleware, async (req, res) => {
    const { text, author, description } = req.body;
    if (!text || text.trim() === "") {
        return res.status(400).json({ message: 'Quote text is required' });
    }
    try {
        const newItem = new VisionBoardItem({ type: 'quote', text: text.trim(), author: author ? author.trim() : undefined, description: description ? description.trim() : undefined, user: req.user.id });
        const item = await newItem.save();
        res.status(201).json({ message: 'Quote added successfully', item });
    } catch (err) {
        console.error('Add quote error:', err.message, err.stack);
        res.status(500).send('Server Error adding quote');
    }
});

// 3. DELETE OLD MULTER CONFIG
// const storage = multer.diskStorage({ ... });
// const fileFilter = (req, file, cb) => { ... };
// const upload = multer({ storage: storage, ... });

// 4. ADD NEW MULTER CONFIG (to process file in memory)
const upload = multer({ storage: multer.memoryStorage() });

// 5. REPLACE THE IMAGE UPLOAD ROUTE
app.post('/api/visionboard/image', authMiddleware, upload.single('imageFile'), async (req, res) => {
    const { description } = req.body;
    if (!req.file) {
        return res.status(400).json({ message: 'Image file is required' });
    }

    try {
        const filename = req.file.originalname;
        const blob = await put(filename, req.file.buffer, { access: 'public' });

        const newItem = new VisionBoardItem({
            type: 'image',
            url: blob.url, // Save the public URL from Vercel Blob
            description: description ? description.trim() : undefined,
            user: req.user.id
        });

        const item = await newItem.save();
        res.status(201).json({ message: 'Image uploaded successfully', item });

    } catch (err) {
        console.error('Upload image error:', err.message, err.stack);
        return res.status(500).json({ message: 'Server error during image upload.' });
    }
});

app.delete('/api/visionboard/:itemId', authMiddleware, async (req, res) => {
    try {
        const item = await VisionBoardItem.findById(req.params.itemId);
        if (!item) { return res.status(404).json({ message: 'Vision board item not found' }); }
        if (item.user.toString() !== req.user.id) { return res.status(403).json({ message: 'User not authorized' }); }
        await item.deleteOne();
        res.json({ message: 'Vision board item removed successfully' });
    } catch (err) {
        console.error('Delete vision item error:', err.message, err.stack);
        if (err.kind === 'ObjectId') { return res.status(404).json({ message: 'Item not found (ID format)' }); }
        res.status(500).send('Server Error deleting vision board item');
    }
});

module.exports = app;
