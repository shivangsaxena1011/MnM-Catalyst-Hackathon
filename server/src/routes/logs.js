import express from 'express';
import { db } from '../db/database.js';
import { requireAuth, requirePatientAccess, requireEditPermission } from '../middleware/auth.js';
import { getPatientDateTime } from '../services/escalationService.js';

const router = express.Router();

/**
 * Get medication logs for a date range
 * Uses patient's configured timezone consistently
 */
router.get('/:patientId', requireAuth, requirePatientAccess, (req, res) => {
  try {
    const { date, start_date, end_date } = req.query;
    const tzInfo = getPatientDateTime(req.membership.timezone || 'Asia/Kolkata');
    const targetDate = date || tzInfo.date;

    let query = `
      SELECT ml.*, m.name as medication_name, m.dosage, m.form, m.instructions, m.meal_timing,
             u.name as logged_by_name
      FROM medication_logs ml
      JOIN medications m ON ml.medication_id = m.id
      LEFT JOIN users u ON ml.logged_by_user_id = u.id
      WHERE ml.patient_id = ?
    `;
    const params = [req.params.patientId];

    if (start_date && end_date) {
      query += ` AND ml.scheduled_date BETWEEN ? AND ? ORDER BY ml.scheduled_date DESC, ml.id DESC`;
      params.push(start_date, end_date);
    } else {
      query += ` AND ml.scheduled_date = ? ORDER BY ml.id ASC`;
      params.push(targetDate);
    }

    const logs = db.prepare(query).all(...params);

    // Also get all active medications to build the complete daily slots (even if not yet logged)
    const activeMeds = db.prepare(`
      SELECT * FROM medications WHERE patient_id = ? AND is_active = 1
    `).all(req.params.patientId);

    const fullSchedule = [];
    for (const med of activeMeds) {
      let slots = [];
      try {
        slots = JSON.parse(med.schedule_slots);
      } catch {
        slots = [med.schedule_slots];
      }

      for (const slot of slots) {
        // Find existing log for this med and slot
        const existing = logs.find(l => l.medication_id === med.id && l.scheduled_slot === slot);
        if (existing) {
          fullSchedule.push(existing);
        } else {
          // Virtual 'upcoming' slot
          fullSchedule.push({
            id: null,
            patient_id: Number(req.params.patientId),
            medication_id: med.id,
            medication_name: med.name,
            dosage: med.dosage,
            form: med.form,
            instructions: med.instructions,
            meal_timing: med.meal_timing,
            scheduled_date: targetDate,
            scheduled_slot: slot,
            status: 'upcoming',
            taken_at: null,
            skipped_reason: null,
            logged_by_name: null,
          });
        }
      }
    }

    return res.json({ date: targetDate, schedule: fullSchedule, logs });
  } catch (err) {
    console.error('[Get Logs Error]:', err.message);
    return res.status(500).json({ error: 'Failed to fetch medication logs' });
  }
});

/**
 * Record or update dose adherence status (Taken, Missed, Skipped)
 * Strict duplicate prevention & Edit permission enforcement:
 * Only authorized members with can_edit=1 or the senior self can record/update logs.
 */
router.post('/:patientId/log', requireAuth, requirePatientAccess, requireEditPermission, (req, res) => {
  try {
    const {
      medication_id,
      scheduled_date,
      scheduled_slot,
      status, // 'taken', 'missed', 'skipped', 'upcoming'
      skipped_reason,
      notes,
    } = req.body;

    const VALID_STATUSES = ['taken', 'missed', 'skipped', 'upcoming'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    if (!medication_id || !scheduled_date || !scheduled_slot) {
      return res.status(400).json({ error: 'medication_id, scheduled_date, and scheduled_slot are required' });
    }

    // Validate scheduled_date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduled_date)) {
      return res.status(400).json({ error: 'scheduled_date must be in YYYY-MM-DD format' });
    }

    const patientId = Number(req.params.patientId);
    const medId = Number(medication_id);

    // Verify medication belongs to patient
    const med = db.prepare('SELECT * FROM medications WHERE id = ? AND patient_id = ?').get(medId, patientId);
    if (!med) {
      return res.status(404).json({ error: 'Medication not found for this patient' });
    }

    const takenAt = status === 'taken' ? new Date().toISOString() : null;

    // Check existing log
    const existing = db.prepare(`
      SELECT * FROM medication_logs
      WHERE patient_id = ? AND medication_id = ? AND scheduled_date = ? AND scheduled_slot = ?
    `).get(patientId, medId, scheduled_date, scheduled_slot);

    let logId;
    if (existing) {
      // Update existing record (prevent duplicate insertion)
      db.prepare(`
        UPDATE medication_logs
        SET status = ?,
            taken_at = ?,
            skipped_reason = ?,
            notes = ?,
            logged_by_user_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, takenAt, skipped_reason || null, notes || null, req.user.id, existing.id);
      logId = existing.id;
    } else {
      // Insert new log
      const insert = db.prepare(`
        INSERT INTO medication_logs (
          patient_id, medication_id, scheduled_date, scheduled_slot,
          status, taken_at, skipped_reason, logged_by_user_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(patientId, medId, scheduled_date, scheduled_slot, status, takenAt, skipped_reason || null, req.user.id, notes || null);
      logId = Number(insert.lastInsertRowid);
    }

    // If marked as taken:
    // 1. Decrement inventory count if greater than 0
    // 2. Resolve any pending escalation for this medication
    if (status === 'taken') {
      if (med.inventory_count > 0) {
        db.prepare('UPDATE medications SET inventory_count = inventory_count - 1 WHERE id = ?').run(medId);
      }

      // Auto-resolve pending escalation
      db.prepare(`
        UPDATE escalations 
        SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolved_by_user_id = ?, notes = 'Dose confirmed as taken'
        WHERE patient_id = ? AND medication_id = ? AND status = 'active'
      `).run(req.user.id, patientId, medId);

      // Audit activity
      db.prepare(`
        INSERT INTO activities (patient_id, user_id, action_type, title, details)
        VALUES (?, ?, 'medication_taken', 'Dose Confirmed Taken', ?)
      `).run(
        patientId,
        req.user.id,
        `${med.name} (${med.dosage}) taken for ${scheduled_slot.toUpperCase()} on ${scheduled_date}`
      );
    } else if (status === 'skipped') {
      db.prepare(`
        INSERT INTO activities (patient_id, user_id, action_type, title, details)
        VALUES (?, ?, 'medication_skipped', 'Dose Skipped', ?)
      `).run(
        patientId,
        req.user.id,
        `${med.name} skipped for ${scheduled_slot}. Reason: ${skipped_reason || 'No reason provided'}. Protocol: Never double missed dose.`
      );
    }

    const updatedLog = db.prepare(`
      SELECT ml.*, m.name as medication_name, m.dosage, m.form
      FROM medication_logs ml
      JOIN medications m ON ml.medication_id = m.id
      WHERE ml.id = ?
    `).get(logId);

    return res.json({
      message: `Dose recorded as ${status}`,
      log: updatedLog,
    });
  } catch (err) {
    console.error('[Record Log Error]:', err.message);
    return res.status(500).json({ error: 'Failed to record medication status' });
  }
});

/**
 * Adherence Analytics for charts and Family Dashboard
 * Uses patient's timezone for accurate daily trend alignment
 */
router.get('/:patientId/adherence-stats', requireAuth, requirePatientAccess, (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    const tz = req.membership.timezone || 'Asia/Kolkata';

    // Compute last 7 days dates using patient's timezone
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
      dates.push(dStr);
    }

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const logs = db.prepare(`
      SELECT scheduled_date, status, scheduled_slot, COUNT(*) as count
      FROM medication_logs
      WHERE patient_id = ? AND scheduled_date BETWEEN ? AND ?
      GROUP BY scheduled_date, status, scheduled_slot
    `).all(patientId, startDate, endDate);

    // Format daily trend data for Recharts
    const trendData = dates.map(date => {
      const dayLogs = logs.filter(l => l.scheduled_date === date);
      let taken = 0;
      let missed = 0;
      let skipped = 0;

      for (const l of dayLogs) {
        if (l.status === 'taken') taken += l.count;
        if (l.status === 'missed') missed += l.count;
        if (l.status === 'skipped') skipped += l.count;
      }

      const totalExpected = taken + missed + skipped;
      const rate = totalExpected > 0 ? Math.round((taken / totalExpected) * 100) : 100;

      const dateObj = new Date(`${date}T12:00:00Z`);
      const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

      return {
        date,
        day: dayLabel,
        taken,
        missed,
        skipped,
        rate,
      };
    });

    // Compute overall 7-day metrics
    let totalTaken = 0;
    let totalMissed = 0;
    let totalSkipped = 0;

    for (const d of trendData) {
      totalTaken += d.taken;
      totalMissed += d.missed;
      totalSkipped += d.skipped;
    }

    const totalDoses = totalTaken + totalMissed + totalSkipped;
    const overallAdherenceRate = totalDoses > 0 ? Math.round((totalTaken / totalDoses) * 100) : 100;

    // Slot distribution (Morning vs Afternoon vs Evening vs Night)
    const slotStats = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const l of logs) {
      if (l.status === 'taken' && slotStats[l.scheduled_slot.toLowerCase()] !== undefined) {
        slotStats[l.scheduled_slot.toLowerCase()] += l.count;
      }
    }

    return res.json({
      overallAdherenceRate,
      totalDoses,
      totalTaken,
      totalMissed,
      totalSkipped,
      trendData,
      slotStats,
    });
  } catch (err) {
    console.error('[Adherence Stats Error]:', err.message);
    return res.status(500).json({ error: 'Failed to calculate adherence metrics' });
  }
});

export default router;
