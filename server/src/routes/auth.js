import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Register a new user
 * Roles: 'senior', 'family', 'caregiver'
 */
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { name, email, password, passcode, role = 'senior', phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Hash passcode if provided (4-6 digits for elder quick access)
    let passcode_hash = null;
    if (passcode) {
      passcode_hash = await bcrypt.hash(String(passcode).trim(), 10);
    }

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, passcode_hash, role, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name.trim(), normalizedEmail, password_hash, passcode_hash, role, phone || null);

    const newUser = {
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      email: normalizedEmail,
      role,
      phone: phone || null,
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser,
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({ error: 'Server error during registration' });
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
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

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
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * Elder-Friendly Quick Passcode Login (PIN access)
 */
router.post('/passcode-login', authRateLimiter, async (req, res) => {
  try {
    const { email, passcode } = req.body;

    if (!email || !passcode) {
      return res.status(400).json({ error: 'Email and Passcode are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    if (!user || !user.passcode_hash) {
      return res.status(401).json({ error: 'No passcode configured for this account. Please use password login.' });
    }

    const isMatch = await bcrypt.compare(String(passcode).trim(), user.passcode_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect passcode. Please try again.' });
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
      message: 'Passcode verified',
      token,
      user: userObj,
    });
  } catch (err) {
    console.error('[Auth Passcode Login Error]:', err);
    return res.status(500).json({ error: 'Server error during passcode login' });
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
    console.error('[Auth Me Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

/**
 * Set or Update 4-6 digit Passcode
 */
router.post('/set-passcode', requireAuth, async (req, res) => {
  try {
    const { passcode } = req.body;
    if (!passcode || String(passcode).trim().length < 4) {
      return res.status(400).json({ error: 'Passcode must be at least 4 digits' });
    }

    const passcode_hash = await bcrypt.hash(String(passcode).trim(), 10);
    db.prepare('UPDATE users SET passcode_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passcode_hash, req.user.id);

    return res.json({ message: 'Passcode updated successfully' });
  } catch (err) {
    console.error('[Set Passcode Error]:', err);
    return res.status(500).json({ error: 'Failed to update passcode' });
  }
});

export default router;
