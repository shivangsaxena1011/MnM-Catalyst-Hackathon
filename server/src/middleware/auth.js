import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'saathi_care_jwt_default_secret_dev_2026';

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
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
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
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
}

/**
 * Verify user has access to a specific patient's data
 * Attaches req.membership = { patient_id, user_id, role, can_edit, ... }
 */
export function requirePatientAccess(req, res, next) {
  const patientId = req.params.patientId || req.body.patient_id || req.query.patient_id;
  if (!patientId) {
    return res.status(400).json({ error: 'Bad Request: patient_id is required' });
  }

  // Check if user is in the Care Circle for this patient
  const membership = db.prepare(`
    SELECT cc.*, p.full_name as patient_name, p.invite_code, p.emergency_contact_phone
    FROM care_circle cc
    JOIN patients p ON cc.patient_id = p.id
    WHERE cc.patient_id = ? AND cc.user_id = ?
  `).get(Number(patientId), req.user.id);

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

  if (req.membership.can_edit !== 1) {
    return res.status(403).json({ error: 'Forbidden: You have view-only access to this patient profile' });
  }

  next();
}
