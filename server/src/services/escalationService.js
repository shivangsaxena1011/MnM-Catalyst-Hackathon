import { db } from '../db/database.js';
import {
  sendNotificationEmail,
  buildEscalationEmail,
  buildAppointmentEmail,
  buildUpcomingDoseEmail
} from './emailService.js';

/**
 * Standard slot mapping for default times
 */
export const SLOT_DEFAULT_TIMES = {
  morning: '08:00',
  afternoon: '13:00',
  evening: '18:00',
  night: '21:00',
};

/**
 * Helper to compute date and time in patient's configured timezone
 */
export function getPatientDateTime(timezone = 'Asia/Kolkata') {
  const now = new Date();
  try {
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now); // 'YYYY-MM-DD'

    const timeParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const hours = Number(timeParts.find(p => p.type === 'hour')?.value || 0);
    const minutes = Number(timeParts.find(p => p.type === 'minute')?.value || 0);

    return {
      date: dateStr,
      hours,
      minutes,
      currentTimeMinutes: hours * 60 + minutes,
      timeString: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  } catch (err) {
    const dateStr = now.toISOString().split('T')[0];
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    return {
      date: dateStr,
      hours,
      minutes,
      currentTimeMinutes: hours * 60 + minutes,
      timeString: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  }
}

/**
 * Concurrency guard to prevent duplicate concurrent escalation scans
 */
let isScanning = false;

/**
 * Run escalation check for unconfirmed doses
 * Can be triggered manually or periodically
 */
export async function checkAndEscalateDoses(patientId = null) {
  if (isScanning) {
    console.log('[EscalationEngine] Scan already in progress. Skipping redundant trigger.');
    return [];
  }
  isScanning = true;

  try {
    // Query medications for target patient or all active patients
    let medsQuery = `
      SELECT m.*, p.full_name as patient_name, p.emergency_contact_phone, p.timezone
      FROM medications m
      JOIN patients p ON m.patient_id = p.id
      WHERE m.is_active = 1
    `;
    const params = [];
    if (patientId) {
      medsQuery += ' AND m.patient_id = ?';
      params.push(patientId);
    }

    const activeMeds = db.prepare(medsQuery).all(...params);
    const escalationsTriggered = [];

    for (const med of activeMeds) {
      // 1. Patient timezone resolution
      const tz = med.timezone || 'Asia/Kolkata';
      const patientTime = getPatientDateTime(tz);
      const patientDate = patientTime.date;
      const currentTimeMinutes = patientTime.currentTimeMinutes;

      let slots = [];
      try {
        slots = JSON.parse(med.schedule_slots);
      } catch {
        slots = [med.schedule_slots];
      }

      for (const slot of slots) {
        // 2. Check existing log for today in patient's timezone
        const existingLog = db.prepare(`
          SELECT * FROM medication_logs 
          WHERE patient_id = ? AND medication_id = ? AND scheduled_date = ? AND scheduled_slot = ?
        `).get(med.patient_id, med.id, patientDate, slot);

        // Safety check: A taken or skipped dose NEVER triggers missed-dose escalation!
        if (existingLog && (existingLog.status === 'taken' || existingLog.status === 'skipped')) {
          continue;
        }

        // 3. Custom medication timing resolution
        let slotTimeStr = SLOT_DEFAULT_TIMES[slot.toLowerCase()];
        if (!slotTimeStr) {
          if (/^\d{1,2}:\d{2}$/.test(slot)) {
            slotTimeStr = slot.length === 4 ? `0${slot}` : slot;
          } else if (med.custom_time && /^\d{1,2}:\d{2}$/.test(med.custom_time)) {
            slotTimeStr = med.custom_time.length === 4 ? `0${med.custom_time}` : med.custom_time;
          } else {
            slotTimeStr = '09:00';
          }
        }

        const [sh, sm] = slotTimeStr.split(':').map(Number);
        const scheduledMinutes = sh * 60 + (sm || 0);

        // 4. Calculate minutes elapsed since scheduled dose in patient's local timezone
        const diffMinutes = currentTimeMinutes - scheduledMinutes;

        // Only escalate if the scheduled time has passed by > 15 minutes
        if (diffMinutes > 15) {
          let tier = 1; // 15-45 mins: Tier 1 Gentle Reminder
          if (diffMinutes >= 90) {
            tier = 3;   // 90+ mins: Tier 3 Caregiver Alert & Escalation
          } else if (diffMinutes >= 45) {
            tier = 2;   // 45-90 mins: Tier 2 Follow-up Warning
          }

          // 5. Anti-duplicate check: Prevent creating duplicate alerts for the same dose today
          const existingEscalation = db.prepare(`
            SELECT * FROM escalations 
            WHERE patient_id = ? AND medication_id = ? AND scheduled_time = ? AND (DATE(created_at) = ? OR DATE(notified_at) = ?)
          `).get(med.patient_id, med.id, slotTimeStr, patientDate, patientDate);

          if (!existingEscalation) {
            // Keep log status accurate: do NOT mark as "confirmed missed" if it is merely unconfirmed/overdue!
            let logId = existingLog ? existingLog.id : null;
            if (!existingLog) {
              const insertLog = db.prepare(`
                INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status, notes)
                VALUES (?, ?, ?, ?, 'upcoming', 'Unconfirmed dose - overdue check active')
              `).run(med.patient_id, med.id, patientDate, slot);
              logId = insertLog.lastInsertRowid;
            }

            const message = `Tier ${tier} Escalation: ${med.patient_name} has not confirmed ${med.name} (${med.dosage}) scheduled for ${slot.toUpperCase()} (${slotTimeStr}). Protocol: Never double missed dose.`;

            // Insert escalation record
            const escResult = db.prepare(`
              INSERT INTO escalations (patient_id, medication_id, log_id, tier, status, scheduled_time, message)
              VALUES (?, ?, ?, ?, 'active', ?, ?)
            `).run(med.patient_id, med.id, logId, tier, slotTimeStr, message);

            const escalationId = escResult.lastInsertRowid;

            // Notify Care Circle members
            const careCircleMembers = db.prepare(`
              SELECT cc.*, u.email, u.name as user_name
              FROM care_circle cc
              JOIN users u ON cc.user_id = u.id
              WHERE cc.patient_id = ?
            `).all(med.patient_id);

            let caregiversCount = 0;

            for (const member of careCircleMembers) {
              if (tier === 3 || member.role === 'senior') {
                const priority = tier === 3 ? 'critical' : (tier === 2 ? 'high' : 'medium');
                
                // Real Nodemailer dispatch
                let emailStatus = 'not_applicable';
                if (tier === 3 && (member.role === 'caregiver' || member.role === 'family')) {
                  caregiversCount++;
                  const emailHtml = buildEscalationEmail({
                    patientName: med.patient_name,
                    medicineName: med.name,
                    dosage: med.dosage,
                    scheduledSlot: slot,
                    scheduledTime: slotTimeStr,
                    tier,
                  });

                  const emailRes = await sendNotificationEmail({
                    to: member.email,
                    subject: `🚨 [SAATHI CARE ESCALATION] Unconfirmed dose for ${med.patient_name}`,
                    htmlContent: emailHtml,
                    textFallback: message,
                  });
                  emailStatus = emailRes.status;
                }

                // In-app Notification
                db.prepare(`
                  INSERT INTO notifications (patient_id, user_id, title, message, type, priority, email_status)
                  VALUES (?, ?, ?, ?, 'escalation', ?, ?)
                `).run(
                  med.patient_id, 
                  member.user_id, 
                  `Dose Escalation Alert (Tier ${tier})`, 
                  message, 
                  priority, 
                  emailStatus
                );
              }
            }

            // Update caregivers notified count
            if (caregiversCount > 0) {
              db.prepare(`UPDATE escalations SET caregivers_notified = ? WHERE id = ?`).run(caregiversCount, escalationId);
            }

            // Record in activities audit
            db.prepare(`
              INSERT INTO activities (patient_id, user_id, action_type, title, details)
              VALUES (?, NULL, 'escalation_triggered', ?, ?)
            `).run(
              med.patient_id,
              `Tier ${tier} Escalation: ${med.name}`,
              `Unconfirmed ${slot} dose (${slotTimeStr}). Caregivers alerted. Reminder: DO NOT DOUBLE MISSED DOSE.`
            );

            escalationsTriggered.push({
              escalationId,
              medication: med.name,
              patient: med.patient_name,
              tier,
              slot,
              scheduledTime: slotTimeStr,
            });
          }
        }
      }
    }

    return escalationsTriggered;
  } finally {
    isScanning = false;
  }
}

/**
 * Manually trigger an escalation for testing/demo purposes
 */
export async function triggerManualEscalation({ patientId, medicationId, slot = 'morning', tier = 3 }) {
  const med = db.prepare(`
    SELECT m.*, p.full_name as patient_name, p.timezone 
    FROM medications m 
    JOIN patients p ON m.patient_id = p.id 
    WHERE m.id = ? AND m.patient_id = ?
  `).get(medicationId, patientId);

  if (!med) throw new Error('Medication or Patient not found');

  const tz = med.timezone || 'Asia/Kolkata';
  const patientTime = getPatientDateTime(tz);
  const patientDate = patientTime.date;

  // Verify dose is not already taken
  const existingLog = db.prepare(`
    SELECT * FROM medication_logs 
    WHERE patient_id = ? AND medication_id = ? AND scheduled_date = ? AND scheduled_slot = ?
  `).get(patientId, medicationId, patientDate, slot);

  if (existingLog && existingLog.status === 'taken') {
    throw new Error('Cannot escalate: This dose has already been confirmed as taken for today.');
  }

  let slotTimeStr = SLOT_DEFAULT_TIMES[slot.toLowerCase()] || (/^\d{1,2}:\d{2}$/.test(slot) ? slot : '08:00');
  const message = `Tier ${tier} Escalation (Simulated): ${med.patient_name} has an unconfirmed dose of ${med.name} (${med.dosage}) for ${slot.toUpperCase()} (${slotTimeStr}). Never double missed dose.`;

  let logId = existingLog ? existingLog.id : null;
  if (!existingLog) {
    const res = db.prepare(`
      INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status, notes)
      VALUES (?, ?, ?, ?, 'upcoming', 'Unconfirmed dose simulated for escalation test')
    `).run(patientId, medicationId, patientDate, slot);
    logId = res.lastInsertRowid;
  }

  const esc = db.prepare(`
    INSERT INTO escalations (patient_id, medication_id, log_id, tier, status, scheduled_time, message)
    VALUES (?, ?, ?, ?, 'active', ?, ?)
  `).run(patientId, medicationId, logId, tier, slotTimeStr, message);

  // Send caregiver email and notifications
  const members = db.prepare(`
    SELECT cc.*, u.email, u.name as user_name
    FROM care_circle cc
    JOIN users u ON cc.user_id = u.id
    WHERE cc.patient_id = ?
  `).all(patientId);

  let notifiedCount = 0;
  for (const m of members) {
    let emailStatus = 'not_applicable';
    if (m.role === 'caregiver' || m.role === 'family') {
      notifiedCount++;
      const emailHtml = buildEscalationEmail({
        patientName: med.patient_name,
        medicineName: med.name,
        dosage: med.dosage,
        scheduledSlot: slot,
        scheduledTime: slotTimeStr,
        tier,
      });

      const res = await sendNotificationEmail({
        to: m.email,
        subject: `🚨 [SAATHI CARE ESCALATION] Unconfirmed dose for ${med.patient_name}`,
        htmlContent: emailHtml,
        textFallback: message,
      });
      emailStatus = res.status;
    }

    db.prepare(`
      INSERT INTO notifications (patient_id, user_id, title, message, type, priority, email_status)
      VALUES (?, ?, ?, ?, 'escalation', 'critical', ?)
    `).run(patientId, m.user_id, `Dose Escalation Alert (Tier ${tier})`, message, emailStatus);
  }

  db.prepare(`UPDATE escalations SET caregivers_notified = ? WHERE id = ?`).run(notifiedCount, esc.lastInsertRowid);

  db.prepare(`
    INSERT INTO activities (patient_id, user_id, action_type, title, details)
    VALUES (?, NULL, 'escalation_triggered', ?, ?)
  `).run(
    patientId,
    `Tier ${tier} Escalation Triggered: ${med.name}`,
    `Simulated alert for test/demo. Care circle notified. Protocol: Never double missed dose.`
  );

  return { escalationId: esc.lastInsertRowid, notifiedCount, message };
}

/**
 * Check and send appointment reminder emails based on appointment reminder_hours
 * Marks appointment reminder_sent = 1 to prevent duplicate dispatches
 */
export async function checkAndSendAppointmentReminders() {
  const appts = db.prepare(`
    SELECT a.*, p.full_name as patient_name, p.timezone, p.senior_user_id
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.status = 'upcoming' AND (a.reminder_sent = 0 OR a.reminder_sent IS NULL)
  `).all();

  const results = [];
  for (const appt of appts) {
    const { date: currentDate, timeString: currentTimeString } = getPatientDateTime(appt.timezone || 'Asia/Kolkata');
    
    // Parse appointment datetime and current datetime
    const apptDateTime = new Date(`${appt.appointment_date}T${appt.appointment_time || '09:00'}:00`);
    const currentDateTime = new Date(`${currentDate}T${currentTimeString}:00`);
    const diffHours = (apptDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60);

    const reminderThresholdHours = appt.reminder_hours || 24;

    // Send if within window and not in the past
    if (diffHours >= 0 && diffHours <= reminderThresholdHours) {
      const members = db.prepare(`
        SELECT u.email, u.name, u.id as user_id
        FROM care_circle c
        JOIN users u ON c.user_id = u.id
        WHERE c.patient_id = ?
      `).all(appt.patient_id);

      const emailHtml = buildAppointmentEmail({
        patientName: appt.patient_name,
        doctorName: appt.doctor_name,
        specialty: appt.specialty,
        hospital: appt.clinic_hospital,
        appointmentDate: appt.appointment_date,
        appointmentTime: appt.appointment_time,
        notes: appt.notes,
      });

      const message = `Upcoming Appointment: ${appt.patient_name} has an appointment with ${appt.doctor_name} (${appt.specialty}) at ${appt.clinic_hospital} on ${appt.appointment_date} at ${appt.appointment_time}.`;

      for (const m of members) {
        let emailStatus = 'not_applicable';
        if (m.email) {
          const res = await sendNotificationEmail({
            to: m.email,
            subject: `🗓️ [SAATHI CARE] Appointment Reminder for ${appt.patient_name}`,
            htmlContent: emailHtml,
            textFallback: message,
          });
          emailStatus = res.status;
        }

        db.prepare(`
          INSERT INTO notifications (patient_id, user_id, title, message, type, priority, email_status)
          VALUES (?, ?, ?, ?, 'appointment', 'medium', ?)
        `).run(appt.patient_id, m.user_id, `Appointment Reminder: ${appt.doctor_name}`, message, emailStatus);
      }

      db.prepare(`UPDATE appointments SET reminder_sent = 1 WHERE id = ?`).run(appt.id);
      results.push({ appointmentId: appt.id, doctorName: appt.doctor_name });
    }
  }
  return results;
}

/**
 * Check and send upcoming medication dose reminders (15-30 minutes before scheduled slot)
 * Uses upcoming_dose_reminders table to ensure each dose email is sent only once per day
 */
export async function checkAndSendUpcomingDoseReminders() {
  const meds = db.prepare(`
    SELECT m.*, p.full_name as patient_name, p.timezone, p.senior_user_id
    FROM medications m
    JOIN patients p ON m.patient_id = p.id
    WHERE m.is_active = 1
  `).all();

  const results = [];
  for (const med of meds) {
    const { date: todayDate, currentTimeMinutes } = getPatientDateTime(med.timezone || 'Asia/Kolkata');

    const slots = (med.schedule_slots || 'morning').split(',').map(s => s.trim().toLowerCase());

    for (const slot of slots) {
      const scheduledTime = med.custom_time || SLOT_DEFAULT_TIMES[slot] || '08:00';
      const [h, min] = scheduledTime.split(':').map(Number);
      const scheduledMinutes = h * 60 + min;

      // Window: 0 to 30 minutes before due time
      const diffMinutes = scheduledMinutes - currentTimeMinutes;
      if (diffMinutes >= 0 && diffMinutes <= 30) {
        // Ensure not already logged today
        const existingLog = db.prepare(`
          SELECT id FROM medication_logs
          WHERE patient_id = ? AND medication_id = ? AND scheduled_date = ? AND scheduled_slot = ?
        `).get(med.patient_id, med.id, todayDate, slot);

        if (!existingLog) {
          // Ensure reminder email not already dispatched for this slot today
          const alreadySent = db.prepare(`
            SELECT id FROM upcoming_dose_reminders
            WHERE patient_id = ? AND medication_id = ? AND scheduled_date = ? AND scheduled_slot = ?
          `).get(med.patient_id, med.id, todayDate, slot);

          if (!alreadySent) {
            db.prepare(`
              INSERT INTO upcoming_dose_reminders (patient_id, medication_id, scheduled_date, scheduled_slot)
              VALUES (?, ?, ?, ?)
            `).run(med.patient_id, med.id, todayDate, slot);

            const members = db.prepare(`
              SELECT u.email, u.name, u.id as user_id, c.role
              FROM care_circle c
              JOIN users u ON c.user_id = u.id
              WHERE c.patient_id = ?
            `).all(med.patient_id);

            const emailHtml = buildUpcomingDoseEmail({
              patientName: med.patient_name,
              medicineName: med.name,
              dosage: med.dosage,
              instructions: med.instructions,
              scheduledSlot: slot,
              scheduledTime,
              minutesUntil: diffMinutes,
            });

            const message = `Upcoming Dose: ${med.patient_name} has a dose of ${med.name} (${med.dosage}) due at ${scheduledTime} (${slot.toUpperCase()}).`;

            for (const m of members) {
              let emailStatus = 'not_applicable';
              if (m.email) {
                const res = await sendNotificationEmail({
                  to: m.email,
                  subject: `⏰ [SAATHI CARE] Upcoming Dose Reminder: ${med.name} (${scheduledTime})`,
                  htmlContent: emailHtml,
                  textFallback: message,
                });
                emailStatus = res.status;
              }

              db.prepare(`
                INSERT INTO notifications (patient_id, user_id, title, message, type, priority, email_status)
                VALUES (?, ?, ?, ?, 'dose_reminder', 'low', ?)
              `).run(med.patient_id, m.user_id, `Upcoming Dose: ${med.name}`, message, emailStatus);
            }

            results.push({ medicationId: med.id, slot, scheduledTime });
          }
        }
      }
    }
  }
  return results;
}
