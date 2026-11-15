import express from 'express';
import { db } from '../db/database.js';
import { requireAuth, requirePatientAccess, requireEditPermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * List all active medications for a patient
 */
router.get('/:patientId', requireAuth, requirePatientAccess, (req, res) => {
  try {
    const meds = db.prepare(`
      SELECT * FROM medications
      WHERE patient_id = ? AND is_active = 1
      ORDER BY name ASC
    `).all(req.params.patientId);

    // Parse schedule_slots from JSON string
    const formatted = meds.map(m => {
      let slots = [];
      try {
        slots = JSON.parse(m.schedule_slots);
      } catch {
        slots = [m.schedule_slots];
      }
      return { ...m, schedule_slots: slots };
    });

    return res.json({ medications: formatted });
  } catch (err) {
    console.error('[Get Medications Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

/**
 * Add a new medication
 */
router.post('/:patientId', requireAuth, requirePatientAccess, requireEditPermission, (req, res) => {
  try {
    const {
      name,
      generic_name,
      dosage,
      form = 'Tablet',
      instructions,
      meal_timing = 'after_food',
      schedule_slots = ['morning'],
      frequency = 'daily',
      inventory_count = 30,
      refill_alert_threshold = 5,
      prescribed_by,
    } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({ error: 'Medication name and dosage are required' });
    }

    const slotsJson = JSON.stringify(Array.isArray(schedule_slots) ? schedule_slots : [schedule_slots]);

    const result = db.prepare(`
      INSERT INTO medications (
        patient_id, name, generic_name, dosage, form, instructions,
        meal_timing, schedule_slots, frequency, inventory_count,
        refill_alert_threshold, prescribed_by, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      req.params.patientId,
      name.trim(),
      generic_name ? generic_name.trim() : null,
      dosage.trim(),
      form,
      instructions ? instructions.trim() : null,
      meal_timing,
      slotsJson,
      frequency,
      Number(inventory_count) || 30,
      Number(refill_alert_threshold) || 5,
      prescribed_by ? prescribed_by.trim() : null
    );

    const newMedId = Number(result.lastInsertRowid);

    // Audit log
    db.prepare(`
      INSERT INTO activities (patient_id, user_id, action_type, title, details)
      VALUES (?, ?, 'medication_added', 'Medication Added', ?)
    `).run(
      req.params.patientId,
      req.user.id,
      `Prescribed ${name} (${dosage}), ${form}, ${slotsJson}`
    );

    const created = db.prepare('SELECT * FROM medications WHERE id = ?').get(newMedId);
    return res.status(201).json({
      message: 'Medication added successfully',
      medication: { ...created, schedule_slots: JSON.parse(created.schedule_slots) },
    });
  } catch (err) {
    console.error('[Add Medication Error]:', err);
    return res.status(500).json({ error: 'Failed to add medication' });
  }
});

/**
 * Update an existing medication
 */
router.put('/:patientId/:medicationId', requireAuth, requirePatientAccess, requireEditPermission, (req, res) => {
  try {
    const {
      name,
      generic_name,
      dosage,
      form,
      instructions,
      meal_timing,
      schedule_slots,
      frequency,
      inventory_count,
      refill_alert_threshold,
      prescribed_by,
    } = req.body;

    const slotsJson = schedule_slots 
      ? JSON.stringify(Array.isArray(schedule_slots) ? schedule_slots : [schedule_slots])
      : null;

    db.prepare(`
      UPDATE medications
      SET name = COALESCE(?, name),
          generic_name = COALESCE(?, generic_name),
          dosage = COALESCE(?, dosage),
          form = COALESCE(?, form),
          instructions = COALESCE(?, instructions),
          meal_timing = COALESCE(?, meal_timing),
          schedule_slots = COALESCE(?, schedule_slots),
          frequency = COALESCE(?, frequency),
          inventory_count = COALESCE(?, inventory_count),
          refill_alert_threshold = COALESCE(?, refill_alert_threshold),
          prescribed_by = COALESCE(?, prescribed_by),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND patient_id = ?
    `).run(
      name, generic_name, dosage, form, instructions,
      meal_timing, slotsJson, frequency, inventory_count,
      refill_alert_threshold, prescribed_by,
      req.params.medicationId, req.params.patientId
    );

    const updated = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.medicationId);
    return res.json({
      message: 'Medication updated successfully',
      medication: { ...updated, schedule_slots: JSON.parse(updated.schedule_slots) },
    });
  } catch (err) {
    console.error('[Update Medication Error]:', err);
    return res.status(500).json({ error: 'Failed to update medication' });
  }
});

/**
 * Soft delete / deactivate medication
 */
router.delete('/:patientId/:medicationId', requireAuth, requirePatientAccess, requireEditPermission, (req, res) => {
  try {
    const med = db.prepare('SELECT name FROM medications WHERE id = ? AND patient_id = ?').get(req.params.medicationId, req.params.patientId);
    if (!med) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    db.prepare('UPDATE medications SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.medicationId);

    // Audit log
    db.prepare(`
      INSERT INTO activities (patient_id, user_id, action_type, title, details)
      VALUES (?, ?, 'medication_discontinued', 'Medication Discontinued', ?)
    `).run(req.params.patientId, req.user.id, `Discontinued ${med.name}`);

    return res.json({ message: 'Medication discontinued' });
  } catch (err) {
    console.error('[Delete Medication Error]:', err);
    return res.status(500).json({ error: 'Failed to remove medication' });
  }
});

export default router;
