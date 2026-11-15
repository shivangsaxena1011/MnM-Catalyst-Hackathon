import express from 'express';
import { db } from '../db/database.js';
import { requireAuth, requirePatientAccess } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get unified chronological health timeline for a patient
 * Combines medication logs, appointment events, caregiver actions, and escalations
 */
router.get('/:patientId', requireAuth, requirePatientAccess, (req, res) => {
  try {
    const { limit = 50, action_type } = req.query;

    let query = `
      SELECT a.*, u.name as user_name, u.role as user_role
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.patient_id = ?
    `;
    const params = [req.params.patientId];

    if (action_type) {
      query += ' AND a.action_type = ?';
      params.push(action_type);
    }

    query += ' ORDER BY a.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const events = db.prepare(query).all(...params);

    return res.json({ events });
  } catch (err) {
    console.error('[Timeline Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch health timeline' });
  }
});

export default router;
