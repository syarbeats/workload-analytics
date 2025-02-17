const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId, isActive: true });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

// Middleware to check if user can modify another user
const checkUserAccess = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    
    // Admin can modify any user
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Users can only modify themselves
    if (req.user._id.toString() !== targetUserId) {
      return res.status(403).json({ 
        error: 'Access denied. You can only modify your own profile.' 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  auth,
  checkRole,
  checkUserAccess
};
