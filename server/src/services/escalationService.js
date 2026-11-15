import { db } from '../db/database.js';
import { sendNotificationEmail, buildEscalationEmail } from './emailService.js';

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
 * Run escalation check for unconfirmed doses
 * Can be triggered manually or periodically
 */
export async function checkAndEscalateDoses(patientId = null) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHours * 60 + currentMinutes;

  // Query medications for patient (or all active patients)
  let medsQuery = `
    SELECT m.*, p.full_name as patient_name, p.emergency_contact_phone
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
    let slots = [];
    try {
      slots = JSON.parse(med.schedule_slots);
    } catch {
      slots = [med.schedule_slots];
    }

    for (const slot of slots) {
      // Check existing log for today
      const existingLog = db.prepare(`
        SELECT * FROM medication_logs 
        WHERE patient_id = ? AND medication_id = ? AND scheduled_date = ? AND scheduled_slot = ?
      `).get(med.patient_id, med.id, today, slot);

      // If already taken or skipped, no escalation needed
      if (existingLog && (existingLog.status === 'taken' || existingLog.status === 'skipped')) {
        continue;
      }

      // Determine scheduled time
      let slotTimeStr = med.custom_time || SLOT_DEFAULT_TIMES[slot.toLowerCase()] || '09:00';
      const [sh, sm] = slotTimeStr.split(':').map(Number);
      const scheduledMinutes = sh * 60 + (sm || 0);

      // Calculate minutes elapsed since scheduled dose
      const diffMinutes = currentTimeMinutes - scheduledMinutes;

      // Only escalate if the scheduled time has passed
      if (diffMinutes > 15) {
        let tier = 1; // 15-45 mins: Tier 1 Gentle Reminder
        if (diffMinutes >= 90) {
          tier = 3;   // 90+ mins: Tier 3 Caregiver Alert & Escalation
        } else if (diffMinutes >= 45) {
          tier = 2;   // 45-90 mins: Tier 2 Follow-up Warning
        }

        // Check if an active escalation for this med/date/slot already exists
        const existingEscalation = db.prepare(`
          SELECT * FROM escalations 
          WHERE patient_id = ? AND medication_id = ? AND scheduled_time = ? AND DATE(created_at) = ? AND status = 'active'
        `).get(med.patient_id, med.id, slotTimeStr, today);

        if (!existingEscalation) {
          // If unconfirmed, update/create log as missed if Tier 3
          let logId = existingLog ? existingLog.id : null;
          if (!existingLog) {
            const insertLog = db.prepare(`
              INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status)
              VALUES (?, ?, ?, ?, ?)
            `).run(med.patient_id, med.id, today, slot, tier === 3 ? 'missed' : 'upcoming');
            logId = insertLog.lastInsertRowid;
          } else if (tier === 3 && existingLog.status === 'upcoming') {
            db.prepare(`UPDATE medication_logs SET status = 'missed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(logId);
          }

          const message = `Tier ${tier} Escalation: ${med.patient_name} has not confirmed ${med.name} (${med.dosage}) scheduled for ${slot.toUpperCase()} (${slotTimeStr}).`;

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
            // For Tier 1 and 2, alert senior & in-app. For Tier 3, alert all caregivers/family
            if (tier === 3 || member.role === 'senior') {
              const priority = tier === 3 ? 'critical' : (tier === 2 ? 'high' : 'medium');
              
              // Nodemailer dispatch
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
            INSERT INTO activities (patient_id, action_type, title, details)
            VALUES (?, 'escalation_triggered', ?, ?)
          `).run(
            med.patient_id,
            `Tier ${tier} Escalation: ${med.name}`,
            `Unconfirmed ${slot} dose. Caregivers alerted. Reminder: DO NOT DOUBLE MISSED DOSE.`
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
}

/**
 * Manually trigger an escalation for testing/demo purposes
 */
export async function triggerManualEscalation({ patientId, medicationId, slot = 'morning', tier = 3 }) {
  const med = db.prepare(`
    SELECT m.*, p.full_name as patient_name 
    FROM medications m 
    JOIN patients p ON m.patient_id = p.id 
    WHERE m.id = ? AND m.patient_id = ?
  `).get(medicationId, patientId);

  if (!med) throw new Error('Medication or Patient not found');

  const today = new Date().toISOString().split('T')[0];
  const slotTimeStr = SLOT_DEFAULT_TIMES[slot.toLowerCase()] || '08:00';
  const message = `Tier ${tier} Escalation (Simulated): ${med.patient_name} has an unconfirmed dose of ${med.name} (${med.dosage}) for ${slot.toUpperCase()} (${slotTimeStr}).`;

  // Insert log if not present
  let log = db.prepare(`
    SELECT id FROM medication_logs 
    WHERE patient_id = ? AND medication_id = ? AND scheduled_date = ? AND scheduled_slot = ?
  `).get(patientId, medicationId, today, slot);

  let logId = log ? log.id : null;
  if (!log) {
    const res = db.prepare(`
      INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status)
      VALUES (?, ?, ?, ?, 'missed')
    `).run(patientId, medicationId, today, slot);
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
    INSERT INTO activities (patient_id, action_type, title, details)
    VALUES (?, 'escalation_triggered', ?, ?)
  `).run(
    patientId,
    `Tier ${tier} Escalation Triggered: ${med.name}`,
    `Simulated alert for test/demo. Care circle notified.`
  );

  return { escalationId: esc.lastInsertRowid, notifiedCount, message };
}
