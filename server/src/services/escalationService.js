import { db } from '../db/database.js';
import {
  sendNotificationEmail,
  buildEscalationEmail,
  buildAppointmentEmail,
  buildUpcomingDoseEmail
} from './emailService.js';
import {
  SLOT_DEFAULT_TIMES,
  parseScheduleSlots,
  resolveSlotTime
} from '../utils/schedule.js';

export { SLOT_DEFAULT_TIMES };

const formatterCache = new Map();

/**
 * Intl.DateTimeFormat construction is expensive and background scans call
 * getPatientDateTime once per medication, so formatters are cached per timezone.
 * @param {string} timezone - IANA timezone identifier
 * @returns {{dateFmt: Intl.DateTimeFormat, timeFmt: Intl.DateTimeFormat}}
 */
function getFormatters(timezone) {
  let cached = formatterCache.get(timezone);
  if (!cached) {
    cached = {
      dateFmt: new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      timeFmt: new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };
    formatterCache.set(timezone, cached);
  }
  return cached;
}

/**
 * Build a composite lookup key for per-dose Maps/Sets.
 * @param {...(string|number)} parts
 * @returns {string}
 */
const doseKey = (...parts) => parts.join('|');

/**
 * Memoize care-circle member lookups for the duration of one scan so a patient
 * with several medications triggers only one member query.
 * @param {{all: (patientId: number) => Array<Object>}} stmt - prepared statement taking patient_id
 * @returns {(patientId: number) => Array<Object>}
 */
function memoizeMembers(stmt) {
  const cache = new Map();
  return patientId => {
    if (!cache.has(patientId)) cache.set(patientId, stmt.all(patientId));
    return cache.get(patientId);
  };
}

/**
 * Helper to compute current local date and time in the patient's configured timezone.
 * Defaults to 'Asia/Kolkata' (+05:30) for accurate Indian Standard Time calculation.
 *
 * @param {string} [timezone='Asia/Kolkata'] - IANA timezone identifier
 * @returns {{date: string, hours: number, minutes: number, currentTimeMinutes: number, timeString: string}}
 */
export function getPatientDateTime(timezone = 'Asia/Kolkata') {
  const now = new Date();
  try {
    const { dateFmt, timeFmt } = getFormatters(timezone);
    const dateStr = dateFmt.format(now); // 'YYYY-MM-DD'
    const timeParts = timeFmt.formatToParts(now);

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
 * Scans active medications for unconfirmed doses and triggers multi-tier caregiver escalations.
 * Strictly respects taken/skipped statuses, prevents duplicate escalations, and includes
 * clinical guidance against doubling missed doses.
 *
 * @param {number|null} [patientId=null] - Target patient ID, or null to evaluate all active patients
 * @returns {Promise<Array<{escalationId: number, medication: string, patient: string, tier: number, slot: string, scheduledTime: string}>>}
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

    // Efficiency: Hoist prepared statements out of the loops
    // Efficiency: load recent logs and escalations ONCE per scan instead of one query
    // per dose slot. A 2-day window covers "today" in every patient timezone.
    const recentLogs = new Map();
    for (const log of db.prepare(`
      SELECT id, patient_id, medication_id, scheduled_date, scheduled_slot, status
      FROM medication_logs WHERE scheduled_date >= date('now', '-1 day')
    `).all()) {
      recentLogs.set(doseKey(log.patient_id, log.medication_id, log.scheduled_date, log.scheduled_slot), log);
    }
    const recentEscalations = new Set();
    for (const esc of db.prepare(`
      SELECT patient_id, medication_id, scheduled_time,
             DATE(created_at) AS created_day, DATE(notified_at) AS notified_day
      FROM escalations
      WHERE created_at >= datetime('now', '-2 day') OR notified_at >= datetime('now', '-2 day')
    `).all()) {
      recentEscalations.add(doseKey(esc.patient_id, esc.medication_id, esc.scheduled_time, esc.created_day));
      if (esc.notified_day) {
        recentEscalations.add(doseKey(esc.patient_id, esc.medication_id, esc.scheduled_time, esc.notified_day));
      }
    }
    const stmtInsertUpcomingLog = db.prepare(`
      INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status, notes)
      VALUES (?, ?, ?, ?, 'upcoming', 'Unconfirmed dose - overdue check active')
    `);
    const stmtInsertEscalation = db.prepare(`
      INSERT INTO escalations (patient_id, medication_id, log_id, tier, status, scheduled_time, message)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `);
    const getCareCircleMembers = memoizeMembers(db.prepare(`
      SELECT cc.*, u.email, u.name as user_name
      FROM care_circle cc
      JOIN users u ON cc.user_id = u.id
      WHERE cc.patient_id = ?
    `));
    const stmtInsertNotification = db.prepare(`
      INSERT INTO notifications (patient_id, user_id, title, message, type, priority, email_status)
      VALUES (?, ?, ?, ?, 'escalation', ?, ?)
    `);
    const stmtUpdateEscalationCaregivers = db.prepare(`
      UPDATE escalations SET caregivers_notified = ? WHERE id = ?
    `);
    const stmtInsertActivity = db.prepare(`
      INSERT INTO activities (patient_id, user_id, action_type, title, details)
      VALUES (?, NULL, 'escalation_triggered', ?, ?)
    `);

    for (const med of activeMeds) {
      // 1. Patient timezone resolution
      const tz = med.timezone || 'Asia/Kolkata';
      const patientTime = getPatientDateTime(tz);
      const patientDate = patientTime.date;
      const currentTimeMinutes = patientTime.currentTimeMinutes;

      const slots = parseScheduleSlots(med.schedule_slots);

      for (const slot of slots) {
        // 2. Check existing log for today in patient's timezone
        const existingLog = recentLogs.get(doseKey(med.patient_id, med.id, patientDate, slot));

        // Safety check: A taken or skipped dose NEVER triggers missed-dose escalation!
        if (existingLog && (existingLog.status === 'taken' || existingLog.status === 'skipped')) {
          continue;
        }

        // 3. Custom medication timing resolution
        const slotTimeStr = resolveSlotTime(slot, med.custom_time);
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
          const escalationKey = doseKey(med.patient_id, med.id, slotTimeStr, patientDate);

          if (!recentEscalations.has(escalationKey)) {
            recentEscalations.add(escalationKey);
            // Keep log status accurate: do NOT mark as "confirmed missed" if it is merely unconfirmed/overdue!
            let logId = existingLog ? existingLog.id : null;
            if (!existingLog) {
              const insertLog = stmtInsertUpcomingLog.run(med.patient_id, med.id, patientDate, slot);
              logId = insertLog.lastInsertRowid;
              recentLogs.set(doseKey(med.patient_id, med.id, patientDate, slot), { id: logId, status: 'upcoming' });
            }

            const message = `Tier ${tier} Escalation: ${med.patient_name} has not confirmed ${med.name} (${med.dosage}) scheduled for ${slot.toUpperCase()} (${slotTimeStr}). Protocol: Never double missed dose.`;

            // Insert escalation record
            const escResult = stmtInsertEscalation.run(med.patient_id, med.id, logId, tier, slotTimeStr, message);
            const escalationId = escResult.lastInsertRowid;

            // Notify Care Circle members
            const careCircleMembers = getCareCircleMembers(med.patient_id);
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
                stmtInsertNotification.run(
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
              stmtUpdateEscalationCaregivers.run(caregiversCount, escalationId);
            }

            // Record in activities audit
            stmtInsertActivity.run(
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
 * Manually triggers a simulated dose escalation for testing or judge demonstration purposes.
 * Refuses escalation if the dose was already confirmed as taken today.
 *
 * @param {Object} params
 * @param {number} params.patientId - Patient identifier
 * @param {number} params.medicationId - Medication identifier
 * @param {string} [params.slot='morning'] - Schedule slot name
 * @param {number} [params.tier=3] - Escalation severity tier (1-3)
 * @returns {Promise<{escalationId: number, notifiedCount: number}>}
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

  const slotTimeStr = resolveSlotTime(slot, med.custom_time);
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

  const stmtInsertNotification = db.prepare(`
    INSERT INTO notifications (patient_id, user_id, title, message, type, priority, email_status)
    VALUES (?, ?, ?, ?, 'escalation', 'critical', ?)
  `);

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

    stmtInsertNotification.run(patientId, m.user_id, `Dose Escalation Alert (Tier ${tier})`, message, emailStatus);
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
 * Scans upcoming doctor appointments and dispatches email notifications to Care Circle members
 * within the configured reminder window (default 24h).
 * Marks appointment reminder_sent = 1 to prevent duplicate dispatches.
 *
 * @returns {Promise<Array<{appointmentId: number, doctorName: string}>>}
 */
export async function checkAndSendAppointmentReminders() {
  const appts = db.prepare(`
    SELECT a.*, p.full_name as patient_name, p.timezone, p.senior_user_id
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.status = 'upcoming' AND (a.reminder_sent = 0 OR a.reminder_sent IS NULL)
  `).all();

  const getApptCareCircle = memoizeMembers(db.prepare(`
    SELECT u.email, u.name, u.id as user_id
    FROM care_circle c
    JOIN users u ON c.user_id = u.id
    WHERE c.patient_id = ?
  `));
  const stmtInsertApptNotification = db.prepare(`
    INSERT INTO notifications (patient_id, user_id, title, message, type, priority, email_status)
    VALUES (?, ?, ?, ?, 'appointment', 'medium', ?)
  `);
  const stmtMarkApptReminderSent = db.prepare(`
    UPDATE appointments SET reminder_sent = 1 WHERE id = ?
  `);

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
      const members = getApptCareCircle(appt.patient_id);

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

        stmtInsertApptNotification.run(appt.patient_id, m.user_id, `Appointment Reminder: ${appt.doctor_name}`, message, emailStatus);
      }

      stmtMarkApptReminderSent.run(appt.id);
      results.push({ appointmentId: appt.id, doctorName: appt.doctor_name });
    }
  }
  return results;
}

/**
 * Scans active medications and dispatches reminder notifications 15-30 minutes before
 * a scheduled dose window. Records each dispatch in upcoming_dose_reminders to prevent
 * duplicate alerts.
 *
 * @returns {Promise<Array<{medicationId: number, slot: string, scheduledTime: string}>>}
 */
export async function checkAndSendUpcomingDoseReminders() {
  const meds = db.prepare(`
    SELECT m.*, p.full_name as patient_name, p.timezone, p.senior_user_id
    FROM medications m
    JOIN patients p ON m.patient_id = p.id
    WHERE m.is_active = 1
  `).all();

  // Efficiency: one query each for recent logs and sent reminders, then O(1) Set lookups.
  const loggedDoses = new Set(db.prepare(`
    SELECT patient_id, medication_id, scheduled_date, scheduled_slot
    FROM medication_logs WHERE scheduled_date >= date('now', '-1 day')
  `).all().map(r => doseKey(r.patient_id, r.medication_id, r.scheduled_date, r.scheduled_slot)));
  const sentReminders = new Set(db.prepare(`
    SELECT patient_id, medication_id, scheduled_date, scheduled_slot
    FROM upcoming_dose_reminders WHERE scheduled_date >= date('now', '-1 day')
  `).all().map(r => doseKey(r.patient_id, r.medication_id, r.scheduled_date, r.scheduled_slot)));
  const stmtInsertUpcomingReminder = db.prepare(`
    INSERT INTO upcoming_dose_reminders (patient_id, medication_id, scheduled_date, scheduled_slot)
    VALUES (?, ?, ?, ?)
  `);
  const getUpcomingCareCircle = memoizeMembers(db.prepare(`
    SELECT u.email, u.name, u.id as user_id, c.role
    FROM care_circle c
    JOIN users u ON c.user_id = u.id
    WHERE c.patient_id = ?
  `));
  const stmtInsertUpcomingDoseNotification = db.prepare(`
    INSERT INTO notifications (patient_id, user_id, title, message, type, priority, email_status)
    VALUES (?, ?, ?, ?, 'dose_reminder', 'low', ?)
  `);

  const results = [];
  for (const med of meds) {
    const { date: todayDate, currentTimeMinutes } = getPatientDateTime(med.timezone || 'Asia/Kolkata');

    const slots = parseScheduleSlots(med.schedule_slots);

    for (const slot of slots) {
      if (!slot) continue;

      const slotTimeStr = resolveSlotTime(slot, med.custom_time);
      const scheduledTime = slotTimeStr;
      const [h, min] = scheduledTime.split(':').map(Number);
      const scheduledMinutes = h * 60 + (min || 0);

      // Window: 0 to 30 minutes before due time
      const diffMinutes = scheduledMinutes - currentTimeMinutes;
      if (diffMinutes >= 0 && diffMinutes <= 30) {
        // Ensure not already logged today
        const key = doseKey(med.patient_id, med.id, todayDate, slot);

        if (!loggedDoses.has(key)) {
          // Ensure reminder email not already dispatched for this slot today
          if (!sentReminders.has(key)) {
            sentReminders.add(key);
            stmtInsertUpcomingReminder.run(med.patient_id, med.id, todayDate, slot);

            const members = getUpcomingCareCircle(med.patient_id);

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

              stmtInsertUpcomingDoseNotification.run(med.patient_id, m.user_id, `Upcoming Dose: ${med.name}`, message, emailStatus);
            }

            results.push({ medicationId: med.id, slot, scheduledTime });
          }
        }
      }
    }
  }
  return results;
}
