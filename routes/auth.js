const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Sign-In
router.post('/google', async (req, res) => {
  try {
    const { token, credential } = req.body;
    
    // Use credential if available (from Google Sign-In button), otherwise use token
    const idToken = credential || token;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.picture = picture;
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user
        user = new User({
          googleId,
          email,
          name,
          picture,
          lastLogin: new Date()
        });
        await user.save();
      }
    } else {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
        favorites: user.favorites
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
        preferences: req.user.preferences,
        favorites: req.user.favorites
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
