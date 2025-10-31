const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// Get user favorites
router.get('/', authMiddleware, async (req, res) => {
  try {
    res.json({ favorites: req.user.favorites });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// Add favorite
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { city, country, lat, lon } = req.body;

    if (!city || !lat || !lon) {
      return res.status(400).json({ error: 'City, latitude, and longitude are required' });
    }

    // Check if already exists
    const exists = req.user.favorites.some(
      fav => fav.city === city && fav.country === country
    );

    if (exists) {
      return res.status(400).json({ error: 'City already in favorites' });
    }

    req.user.favorites.push({ city, country, lat, lon });
    await req.user.save();

    res.json({ success: true, favorites: req.user.favorites });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove favorite
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    req.user.favorites = req.user.favorites.filter(
      fav => fav._id.toString() !== id
    );
    await req.user.save();

    res.json({ success: true, favorites: req.user.favorites });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

module.exports = router;
