// pathfinder-backend/models/VisionBoardItem.js
const mongoose = require('mongoose');

const VisionBoardItemSchema = new mongoose.Schema({
  user: { // Reference to the User who owns this item
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: { // 'image' or 'quote'
    type: String,
    required: true,
    enum: ['image', 'quote'],
  },
  // For images
  url: { // URL of the uploaded image (e.g., from S3 or Cloudinary)
    type: String,
    // required: function() { return this.type === 'image'; } // Only required if type is image
  },
  // For quotes
  text: {
    type: String,
    // required: function() { return this.type === 'quote'; } // Only required if type is quote
    trim: true,
  },
  author: {
    type: String,
    trim: true,
  },
  description: { // Optional description for images or quotes
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('VisionBoardItem', VisionBoardItemSchema);