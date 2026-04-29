const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role_id').optional().isInt({ min: 1, max: 3 }).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
];

// Register user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role_id = 3 } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const userId = await User.create({ name, email, password, role_id });

    res.status(201).json({
      message: 'User registered successfully',
      userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
const login = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (!user) {
      return res.status(401).json({ message: info.message || 'Invalid credentials' });
    }

    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Login failed' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role_id: user.role_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.role_id,
          role_name: user.role_name
        },
        token
      });
    });
  })(req, res, next);
};

// Logout user
const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
};

// Get current user
const getCurrentUser = (req, res) => {
  if (req.user) {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role_id: req.user.role_id,
        role_name: req.user.role_name,
        profile_image: req.user.profile_image,
        bio: req.user.bio
      }
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const userId = req.user.id;

    const success = await User.update(userId, { name, bio });

    if (success) {
      // Get updated user
      const updatedUser = await User.findById(userId);
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          bio: updatedUser.bio,
          profile_image: updatedUser.profile_image
        }
      });
    } else {
      res.status(400).json({ message: 'Profile update failed' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await User.findByEmail(req.user.email);

    // Verify current password
    const isValidPassword = await User.verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    const success = await User.updatePassword(userId, newPassword);

    if (success) {
      res.json({ message: 'Password changed successfully' });
    } else {
      res.status(400).json({ message: 'Password change failed' });
    }
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// API login (returns JWT only)
const apiLogin = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (!user) {
      return res.status(401).json({ message: info.message || 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({ token });
  })(req, res, next);
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  apiLogin,
  registerValidation,
  loginValidation
};