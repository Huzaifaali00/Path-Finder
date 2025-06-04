// pathfinder-backend/models/Goal.js
const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
        required: true,
        trim: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // --- DURATION FIELDS ---
    duration: {
        type: Number,
        required: false, // Optional
        min: [1, 'Duration must be at least 1 if provided'] // Validation message
    },
    durationUnit: {
        type: String,
        required: function () { // Conditionally required: only if duration is provided
            // return this.duration != null && this.duration !== undefined && this.duration !== '';
            // Simpler check if duration is a positive number:
            return typeof this.duration === 'number' && this.duration > 0;
        },
        enum: {
            values: ['days', 'weeks', 'months'],
            message: '{VALUE} is not a supported duration unit. Use days, weeks, or months.'
        }
        // If you want durationUnit to be fully optional even if duration is present (less ideal):
        // required: false,
        // enum: ['days', 'weeks', 'months'] // Still good to have enum
    }
    // --- END OF DURATION FIELDS ---
});

module.exports = mongoose.model('Goal', GoalSchema);