const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Get user preferences
router.get('/', authMiddleware, async (req, res) => {
  try {
    res.json({ preferences: req.user.preferences });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user preferences
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { temperatureUnit, theme } = req.body;

    if (temperatureUnit) {
      if (!['celsius', 'fahrenheit'].includes(temperatureUnit)) {
        return res.status(400).json({ error: 'Invalid temperature unit' });
      }
      req.user.preferences.temperatureUnit = temperatureUnit;
    }

    if (theme) {
      if (!['light', 'dark'].includes(theme)) {
        return res.status(400).json({ error: 'Invalid theme' });
      }
      req.user.preferences.theme = theme;
    }

    await req.user.save();

    res.json({ success: true, preferences: req.user.preferences });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
