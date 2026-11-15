import express from 'express';
import { db } from '../db/database.js';
import { requireAuth, requirePatientAccess, requireEditPermission } from '../middleware/auth.js';
import { sendNotificationEmail, buildAppointmentEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * List all appointments for a patient
 */
router.get('/:patientId', requireAuth, requirePatientAccess, (req, res) => {
  try {
    const appointments = db.prepare(`
      SELECT * FROM appointments
      WHERE patient_id = ?
      ORDER BY appointment_date ASC, appointment_time ASC
    `).all(req.params.patientId);

    const today = new Date().toISOString().split('T')[0];
    const upcoming = appointments.filter(a => a.appointment_date >= today && a.status === 'upcoming');
    const past = appointments.filter(a => a.appointment_date < today || a.status !== 'upcoming');

    return res.json({ appointments, upcoming, past });
  } catch (err) {
    console.error('[Get Appointments Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/**
 * Create a new appointment
 */
router.post('/:patientId', requireAuth, requirePatientAccess, requireEditPermission, async (req, res) => {
  try {
    const {
      doctor_name,
      specialty,
      clinic_hospital,
      address,
      appointment_date,
      appointment_time,
      notes,
      reminder_hours = 24,
    } = req.body;

    if (!doctor_name || !specialty || !clinic_hospital || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Doctor name, specialty, clinic/hospital, date, and time are required' });
    }

    if (String(doctor_name).trim().length > 100) {
      return res.status(400).json({ error: 'Doctor name must not exceed 100 characters' });
    }

    if (notes && String(notes).trim().length > 1000) {
      return res.status(400).json({ error: 'Notes must not exceed 1000 characters' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(appointment_date).trim())) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    if (!/^\d{1,2}:\d{2}$/.test(String(appointment_time).trim())) {
      return res.status(400).json({ error: 'Time must be in HH:MM format' });
    }

    const patientId = Number(req.params.patientId);

    const result = db.prepare(`
      INSERT INTO appointments (
        patient_id, doctor_name, specialty, clinic_hospital, address,
        appointment_date, appointment_time, notes, reminder_hours, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')
    `).run(
      patientId,
      doctor_name.trim(),
      specialty.trim(),
      clinic_hospital.trim(),
      address ? address.trim() : null,
      appointment_date,
      appointment_time,
      notes ? notes.trim() : null,
      Number(reminder_hours) || 24
    );

    const apptId = Number(result.lastInsertRowid);

    // Audit activity
    db.prepare(`
      INSERT INTO activities (patient_id, user_id, action_type, title, details)
      VALUES (?, ?, 'appointment_scheduled', 'Doctor Appointment Scheduled', ?)
    `).run(
      patientId,
      req.user.id,
      `Consultation with Dr. ${doctor_name} (${specialty}) at ${clinic_hospital} on ${appointment_date} at ${appointment_time}`
    );

    // Notify Care Circle
    const patient = db.prepare('SELECT full_name FROM patients WHERE id = ?').get(patientId);
    const members = db.prepare(`
      SELECT cc.*, u.email 
      FROM care_circle cc
      JOIN users u ON cc.user_id = u.id
      WHERE cc.patient_id = ?
    `).all(patientId);

    const notifMsg = `${patient.full_name} has an appointment with Dr. ${doctor_name} (${specialty}) at ${clinic_hospital} on ${appointment_date} at ${appointment_time}.`;
    const emailHtml = buildAppointmentEmail({
      patientName: patient.full_name,
      doctorName: doctor_name.trim(),
      specialty: specialty.trim(),
      hospital: clinic_hospital.trim(),
      appointmentDate: appointment_date,
      appointmentTime: appointment_time,
      notes: notes ? notes.trim() : null,
    });

    for (const m of members) {
      let emailStatus = 'not_applicable';
      if (m.email) {
        sendNotificationEmail({
          to: m.email,
          subject: `🗓️ [SAATHI CARE] Appointment Scheduled for ${patient.full_name}`,
          htmlContent: emailHtml,
          textFallback: notifMsg,
        }).catch(e => console.error('[Appointment Email Error]:', e.message));
      }

      db.prepare(`
        INSERT INTO notifications (patient_id, user_id, title, message, type, priority, email_status)
        VALUES (?, ?, 'Upcoming Doctor Appointment', ?, 'appointment', 'medium', ?)
      `).run(
        patientId,
        m.user_id,
        notifMsg,
        emailStatus
      );
    }

    const created = db.prepare('SELECT * FROM appointments WHERE id = ?').get(apptId);
    return res.status(201).json({
      message: 'Appointment scheduled successfully',
      appointment: created,
    });
  } catch (err) {
    console.error('[Add Appointment Error]:', err);
    return res.status(500).json({ error: 'Failed to schedule appointment' });
  }
});

/**
 * Update an appointment
 */
router.put('/:patientId/:appointmentId', requireAuth, requirePatientAccess, requireEditPermission, (req, res) => {
  try {
    const {
      doctor_name,
      specialty,
      clinic_hospital,
      address,
      appointment_date,
      appointment_time,
      notes,
      status,
      reminder_hours,
    } = req.body;

    if (doctor_name !== undefined && String(doctor_name).trim().length > 100) {
      return res.status(400).json({ error: 'Doctor name must not exceed 100 characters' });
    }

    if (notes !== undefined && notes !== null && String(notes).trim().length > 1000) {
      return res.status(400).json({ error: 'Notes must not exceed 1000 characters' });
    }

    if (appointment_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(appointment_date).trim())) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    if (appointment_time !== undefined && !/^\d{1,2}:\d{2}$/.test(String(appointment_time).trim())) {
      return res.status(400).json({ error: 'Time must be in HH:MM format' });
    }

    db.prepare(`
      UPDATE appointments
      SET doctor_name = COALESCE(?, doctor_name),
          specialty = COALESCE(?, specialty),
          clinic_hospital = COALESCE(?, clinic_hospital),
          address = COALESCE(?, address),
          appointment_date = COALESCE(?, appointment_date),
          appointment_time = COALESCE(?, appointment_time),
          notes = COALESCE(?, notes),
          status = COALESCE(?, status),
          reminder_hours = COALESCE(?, reminder_hours),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND patient_id = ?
    `).run(
      doctor_name, specialty, clinic_hospital, address,
      appointment_date, appointment_time, notes, status, reminder_hours,
      req.params.appointmentId, req.params.patientId
    );

    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.appointmentId);
    return res.json({ message: 'Appointment updated successfully', appointment: updated });
  } catch (err) {
    console.error('[Update Appointment Error]:', err);
    return res.status(500).json({ error: 'Failed to update appointment' });
  }
});

/**
 * Delete an appointment
 */
router.delete('/:patientId/:appointmentId', requireAuth, requirePatientAccess, requireEditPermission, (req, res) => {
  try {
    db.prepare('DELETE FROM appointments WHERE id = ? AND patient_id = ?').run(
      req.params.appointmentId, req.params.patientId
    );
    return res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error('[Delete Appointment Error]:', err);
    return res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

export default router;
