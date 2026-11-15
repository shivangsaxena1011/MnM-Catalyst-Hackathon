import express from 'express';
import { db } from '../db/database.js';
import { requireAuth, requirePatientAccess } from '../middleware/auth.js';
import { checkAndEscalateDoses, triggerManualEscalation } from '../services/escalationService.js';

const router = express.Router();

/**
 * List all escalations for a patient
 */
router.get('/:patientId', requireAuth, requirePatientAccess, (req, res) => {
  try {
    const escalations = db.prepare(`
      SELECT e.*, m.name as medication_name, m.dosage, m.form,
             u.name as resolved_by_name
      FROM escalations e
      JOIN medications m ON e.medication_id = m.id
      LEFT JOIN users u ON e.resolved_by_user_id = u.id
      WHERE e.patient_id = ?
      ORDER BY e.created_at DESC
    `).all(req.params.patientId);

    const active = escalations.filter(e => e.status === 'active');
    const resolved = escalations.filter(e => e.status !== 'active');

    return res.json({ escalations, active, resolved });
  } catch (err) {
    console.error('[Get Escalations Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch escalations' });
  }
});

/**
 * Trigger real-time scan for unconfirmed doses
 */
router.post('/:patientId/scan', requireAuth, requirePatientAccess, async (req, res) => {
  try {
    const triggered = await checkAndEscalateDoses(Number(req.params.patientId));
    return res.json({
      message: triggered.length > 0 ? `Triggered ${triggered.length} escalations` : 'All scheduled doses confirmed or not yet overdue',
      escalationsTriggered: triggered,
    });
  } catch (err) {
    console.error('[Scan Escalations Error]:', err);
    return res.status(500).json({ error: 'Failed to run escalation scan' });
  }
});

/**
 * Trigger a simulated escalation for demo / judges
 */
router.post('/:patientId/simulate', requireAuth, requirePatientAccess, async (req, res) => {
  try {
    const { medication_id, slot = 'morning', tier = 3 } = req.body;

    let targetMedId = medication_id;
    if (!targetMedId) {
      // Pick the first active medication for this patient
      const firstMed = db.prepare('SELECT id FROM medications WHERE patient_id = ? AND is_active = 1 LIMIT 1').get(req.params.patientId);
      if (!firstMed) {
        return res.status(400).json({ error: 'No active medications found to simulate escalation' });
      }
      targetMedId = firstMed.id;
    }

    const result = await triggerManualEscalation({
      patientId: Number(req.params.patientId),
      medicationId: Number(targetMedId),
      slot,
      tier: Number(tier) || 3,
    });

    return res.json({
      message: 'Escalation alert triggered successfully. Notifications dispatched to care circle.',
      ...result,
    });
  } catch (err) {
    console.error('[Simulate Escalation Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to simulate escalation' });
  }
});

/**
 * Resolve an active escalation
 */
router.post('/:patientId/:escalationId/resolve', requireAuth, requirePatientAccess, (req, res) => {
  try {
    const { notes = 'Dose confirmed or followed up with senior' } = req.body;

    db.prepare(`
      UPDATE escalations
      SET status = 'resolved',
          resolved_at = CURRENT_TIMESTAMP,
          resolved_by_user_id = ?,
          notes = ?
      WHERE id = ? AND patient_id = ?
    `).run(req.user.id, notes, req.params.escalationId, req.params.patientId);

    // Audit log
    db.prepare(`
      INSERT INTO activities (patient_id, user_id, action_type, title, details)
      VALUES (?, ?, 'escalation_resolved', 'Escalation Resolved', ?)
    `).run(req.params.patientId, req.user.id, notes);

    return res.json({ message: 'Escalation marked as resolved' });
  } catch (err) {
    console.error('[Resolve Escalation Error]:', err);
    return res.status(500).json({ error: 'Failed to resolve escalation' });
  }
});

export default router;
