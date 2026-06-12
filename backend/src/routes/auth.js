const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { authenticate, verifyViewerSession } = require('../middleware/authMiddleware');
const { validateLoginBody } = require('../middleware/validate');

const router = express.Router();

// ─── Login ───
router.post('/login', validateLoginBody, async (req, res) => {
  try {
    const { userId, password, role } = req.body;

    const user = await User.findOne({ userId: String(userId).trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== role) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let sessionId = null;
    if (user.role === 'viewer') {
      sessionId = crypto.randomUUID();
      user.currentSessionId = sessionId;
      await user.save();
    }

    // Long-lived token for persistent login (1 year)
    const token = jwt.sign(
      {
        userId: user.userId,
        role: user.role,
        sessionId,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.json({
      token,
      user: { name: user.name, role: user.role, userId: user.userId },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Logout ───
router.post('/logout', authenticate, verifyViewerSession, async (req, res) => {
  try {
    if (req.user.role === 'viewer') {
      await User.findOneAndUpdate(
        { userId: req.user.userId },
        { currentSessionId: null }
      );
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Get current user ───
router.get('/me', authenticate, verifyViewerSession, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    res.json({
      user: {
        name: user.name,
        role: user.role,
        userId: user.userId,
      },
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;