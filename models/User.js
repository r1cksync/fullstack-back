const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  picture: {
    type: String
  },
  favorites: [{
    city: String,
    country: String,
    lat: Number,
    lon: Number,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  history: [{
    city: String,
    country: String,
    lat: Number,
    lon: Number,
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    temperatureUnit: {
      type: String,
      enum: ['celsius', 'fahrenheit'],
      default: 'celsius'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
