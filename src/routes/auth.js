const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

/* ===========================
   VALIDATION MIDDLEWARE
=========================== */

const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 12, max: 100 })
    .withMessage('Password must be between 12 and 100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      'Password must contain lowercase, uppercase, number & special character'
    ),
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log validation errors for monitoring and security
    const errorDetails = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.path === 'password' ? '[REDACTED]' : err.value // Don't log actual password values
    }));

    logger.warn('Authentication validation failed', {
      endpoint: req.path,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      email: req.body.email ? req.body.email.toLowerCase() : 'not provided',
      errors: errorDetails,
      errorCount: errors.array().length
    });

    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/* ===========================
   JWT TOKEN GENERATOR (RBAC READY)
=========================== */

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role || 'user', // Default to user if undefined
      email: user.email,
    },
    process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/* ===========================
   REGISTER ORGANIZER
=========================== */

router.post(
  '/register',
  validateRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });

      if (existingUser) {
        logger.warn('Registration attempt with existing email', {
          endpoint: req.path,
          method: req.method,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          email: email.toLowerCase(),
          existingUserId: existingUser._id,
          attemptType: 'duplicate_email'
        });
        return res.status(400).json({
          error: 'Email already registered',
        });
      }

      const user = new User({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        role: 'organizer',
      });

      await user.save();

      const token = generateToken(user);

      logger.info(`✓ New user (organizer) registered: ${email}`);

      res.status(201).json({
        success: true,
        token,
        organizer: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
      });
    }
  }
);

/* ===========================
   LOGIN ORGANIZER
=========================== */

router.post(
  '/login',
  validateLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({
        email: email.toLowerCase(),
      }).select('+password');

      if (!user) {
        logger.warn('Login attempt with non-existent email', {
          endpoint: req.path,
          method: req.method,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          email: email.toLowerCase(),
          attemptType: 'non_existent_email'
        });
        return res.status(401).json({
          error: 'Invalid email or password',
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        logger.warn('Login attempt with invalid password', {
          endpoint: req.path,
          method: req.method,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          email: email.toLowerCase(),
          userId: user._id,
          attemptType: 'invalid_password'
        });
        return res.status(401).json({
          error: 'Invalid email or password',
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user);

      logger.info(`✓ User logged in: ${email}`);

      res.json({
        success: true,
        token,
        organizer: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
      });
    }
  }
);

/* ===========================
   GET CURRENT ORGANIZER (PROTECTED)
=========================== */

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      organizer: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch organizer info',
    });
  }
});

module.exports = router;
