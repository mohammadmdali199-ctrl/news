const jwt = require('jsonwebtoken');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/admin/login');
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role_id === 1) {
    return next();
  }
  req.flash('error_msg', 'Access denied. Admin privileges required.');
  res.redirect('/admin');
};

// Middleware to check if user is editor or admin
const isEditorOrAdmin = (req, res, next) => {
  if (req.isAuthenticated() && (req.user.role_id === 1 || req.user.role_id === 2)) {
    return next();
  }
  req.flash('error_msg', 'Access denied. Editor or Admin privileges required.');
  res.redirect('/admin');
};

// JWT authentication middleware for API
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check API authentication (optional for some endpoints)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isEditorOrAdmin,
  authenticateToken,
  optionalAuth
};