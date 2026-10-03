const express = require('express');
const { getDatabase } = require('../db');
const { hashPassword, verifyPassword } = require('../utils/crypto');
const { generateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Helper: Validate email format
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// POST /api/auth/signup - Normal User Registration
router.post('/signup', (req, res) => {
  const db = getDatabase();
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Name is required.'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Valid email address is required.'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Password must be at least 6 characters long.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_EMAIL',
        message: 'An account with this email already exists.'
      });
    }

    const hashedPassword = hashPassword(password);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'USER')
    `).run(normalizedName, normalizedEmail, hashedPassword);

    const user = {
      id: Number(result.lastInsertRowid),
      name: normalizedName,
      email: normalizedEmail,
      role: 'USER'
    };

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to register user.'
    });
  }
});

// POST /api/auth/rider/signup - Rider Registration
router.post('/rider/signup', (req, res) => {
  const db = getDatabase();
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Name is required.'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Valid email address is required.'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Password must be at least 6 characters long.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_EMAIL',
        message: 'An account with this email already exists.'
      });
    }

    const hashedPassword = hashPassword(password);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'RIDER')
    `).run(normalizedName, normalizedEmail, hashedPassword);

    const user = {
      id: Number(result.lastInsertRowid),
      name: normalizedName,
      email: normalizedEmail,
      role: 'RIDER'
    };

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to register rider.'
    });
  }
});

// POST /api/auth/login - Universal Login (USER, RIDER, ADMIN)
router.post('/login', (req, res) => {
  const db = getDatabase();
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Email and password are required.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const userRow = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(normalizedEmail);
    if (!userRow) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
    }

    const match = verifyPassword(password, userRow.password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role
    };

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Login failed due to a server error.'
    });
  }
});

// GET /api/auth/me - Current Authenticated User Info
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
