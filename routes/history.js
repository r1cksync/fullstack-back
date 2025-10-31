const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// Get user history
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Return only last 10 entries, sorted by most recent
    const history = req.user.history
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, 10);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Add to history
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { city, country, lat, lon } = req.body;

    if (!city || !lat || !lon) {
      return res.status(400).json({ error: 'City, latitude, and longitude are required' });
    }

    // Check if this city is already in recent history (last entry)
    const lastEntry = req.user.history[req.user.history.length - 1];
    if (lastEntry && lastEntry.city === city && lastEntry.country === country) {
      // Update the viewedAt time of the last entry
      lastEntry.viewedAt = new Date();
    } else {
      // Add new entry
      req.user.history.push({ city, country, lat, lon, viewedAt: new Date() });
      
      // Keep only last 20 entries
      if (req.user.history.length > 20) {
        req.user.history = req.user.history.slice(-20);
      }
    }

    await req.user.save();

    res.json({ success: true, history: req.user.history.slice(-10).reverse() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to history' });
  }
});

// Clear history
router.delete('/', authMiddleware, async (req, res) => {
  try {
    req.user.history = [];
    await req.user.save();

    res.json({ success: true, history: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

module.exports = router;
