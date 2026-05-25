const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

async function verifyViewerSession(req, res, next) {
  if (req.user.role !== 'viewer') {
    return next();
  }

  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    if (!user.currentSessionId || user.currentSessionId !== req.user.sessionId) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    next();
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
}

function requireManager(req, res, next) {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied. Manager only.' });
  }
  next();
}

module.exports = {
  authenticate,
  verifyViewerSession,
  requireManager,
};