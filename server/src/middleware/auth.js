import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { db } from '../db/database.js';

// Phase 1 Audit: Remove insecure fallback secrets & enforce >= 32 chars in production
let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be configured in production with at least 32 characters');
  } else {
    JWT_SECRET = crypto.randomBytes(32).toString('hex');
    console.warn('[Security Warning] JWT_SECRET unset in development. Generated ephemeral cryptographic instance secret.');
  }
} else if (process.env.NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters in production');
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user object to req.user
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role, phone FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User no longer exists' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token expired, invalid, or signature rejected' });
  }
}

/**
 * Verify user has access to a specific patient's data
 * Attaches req.membership = { patient_id, user_id, role, can_edit, ... }
 */
export function requirePatientAccess(req, res, next) {
  const rawId = req.params.patientId || req.body.patient_id || req.query.patient_id;
  const patientId = Number(rawId);

  if (!rawId || isNaN(patientId) || patientId <= 0) {
    return res.status(400).json({ error: 'Bad Request: Valid numeric patient_id is required' });
  }

  // Check if user is an active member in the Care Circle for this patient
  const membership = db.prepare(`
    SELECT cc.*, p.full_name as patient_name, p.invite_code, p.emergency_contact_phone, p.timezone, p.senior_user_id
    FROM care_circle cc
    JOIN patients p ON cc.patient_id = p.id
    WHERE cc.patient_id = ? AND cc.user_id = ?
  `).get(patientId, req.user.id);

  if (!membership) {
    return res.status(403).json({ error: 'Forbidden: You do not have access to this patient profile' });
  }

  req.membership = membership;
  next();
}

/**
 * Verify user has permission to edit/modify patient data
 */
export function requireEditPermission(req, res, next) {
  if (!req.membership) {
    return res.status(500).json({ error: 'Internal Error: Patient access must be verified first' });
  }

  // Senior profile owner or members with explicit edit permissions
  const isSeniorOwner = req.membership.role === 'senior' || req.membership.senior_user_id === req.user.id;
  if (!isSeniorOwner && req.membership.can_edit !== 1) {
    return res.status(403).json({ error: 'Forbidden: You have view-only access to this patient profile. Contact the primary care circle owner to request edit permissions.' });
  }

  next();
}
