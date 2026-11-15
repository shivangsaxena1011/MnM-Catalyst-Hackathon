import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const VALID_ROLES = ['senior', 'family', 'caregiver'];
const NUMERIC_PIN_REGEX = /^\d{4,6}$/;

/**
 * Register a new user
 * Strict validation:
 * - Role MUST be one of 'senior', 'family', 'caregiver'
 * - Passcode (if provided) MUST be exactly 4-6 numeric digits
 * - Password must be at least 8 characters
 */
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { name, email, password, passcode, role = 'senior', phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    // Role validation
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Invalid role "${role}". Allowed roles are: ${VALID_ROLES.join(', ')}`,
      });
    }

    // Password strength check
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Passcode validation (if provided)
    let passcode_hash = null;
    if (passcode !== undefined && passcode !== null && String(passcode).trim() !== '') {
      const pinStr = String(passcode).trim();
      if (!NUMERIC_PIN_REGEX.test(pinStr)) {
        return res.status(400).json({
          error: 'Security passcode PIN must contain exactly 4 to 6 numeric digits (0-9)',
        });
      }
      passcode_hash = await bcrypt.hash(pinStr, 10);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password securely
    const password_hash = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, passcode_hash, role, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name.trim(), normalizedEmail, password_hash, passcode_hash, role, phone ? String(phone).trim() : null);

    const newUser = {
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      email: normalizedEmail,
      role,
      phone: phone ? String(phone).trim() : null,
      hasPasscode: Boolean(passcode_hash),
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser,
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err.message);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

/**
 * Standard Email & Password Login
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT id, name, email, password_hash, passcode_hash, role, phone FROM users WHERE email = ?').get(normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      hasPasscode: Boolean(user.passcode_hash),
    };

    const token = generateToken(userObj);

    return res.json({
      message: 'Login successful',
      token,
      user: userObj,
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err.message);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * Elder-Friendly Quick Passcode Login (PIN access)
 * Strict validation: requires 4-6 numeric digits
 */
router.post('/passcode-login', authRateLimiter, async (req, res) => {
  try {
    const { email, passcode } = req.body;

    if (!email || !passcode) {
      return res.status(400).json({ error: 'Email and Passcode PIN are required' });
    }

    const pinStr = String(passcode).trim();
    if (!NUMERIC_PIN_REGEX.test(pinStr)) {
      return res.status(400).json({
        error: 'Passcode must be exactly 4 to 6 numeric digits',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT id, name, email, passcode_hash, role, phone FROM users WHERE email = ?').get(normalizedEmail);

    if (!user || !user.passcode_hash) {
      return res.status(401).json({
        error: 'No passcode PIN configured for this account. Please sign in with your password first.',
      });
    }

    const isMatch = await bcrypt.compare(pinStr, user.passcode_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect passcode PIN. Please try again.' });
    }

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      hasPasscode: true,
    };

    const token = generateToken(userObj);

    return res.json({
      message: 'Passcode verified successfully',
      token,
      user: userObj,
    });
  } catch (err) {
    console.error('[Auth Passcode Login Error]:', err.message);
    return res.status(500).json({ error: 'Internal server error during passcode verification' });
  }
});

/**
 * Get current authenticated user profile and associated patient circles
 */
router.get('/me', requireAuth, (req, res) => {
  try {
    // Fetch all patients this user is a care circle member of
    const patients = db.prepare(`
      SELECT p.*, cc.role as circle_role, cc.relationship, cc.can_edit
      FROM care_circle cc
      JOIN patients p ON cc.patient_id = p.id
      WHERE cc.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);

    return res.json({
      user: req.user,
      patients,
    });
  } catch (err) {
    console.error('[Auth Me Error]:', err.message);
    return res.status(500).json({ error: 'Failed to fetch current user profile' });
  }
});

/**
 * Set or Update 4-6 digit Passcode
 */
router.post('/set-passcode', requireAuth, async (req, res) => {
  try {
    const { passcode } = req.body;
    if (!passcode) {
      return res.status(400).json({ error: 'Passcode PIN is required' });
    }

    const pinStr = String(passcode).trim();
    if (!NUMERIC_PIN_REGEX.test(pinStr)) {
      return res.status(400).json({
        error: 'Passcode must be exactly 4 to 6 numeric digits (0-9)',
      });
    }

    const passcode_hash = await bcrypt.hash(pinStr, 10);
    db.prepare('UPDATE users SET passcode_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passcode_hash, req.user.id);

    return res.json({ message: 'Security PIN updated successfully' });
  } catch (err) {
    console.error('[Set Passcode Error]:', err.message);
    return res.status(500).json({ error: 'Failed to update passcode PIN' });
  }
});

export default router;
