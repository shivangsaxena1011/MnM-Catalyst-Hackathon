import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { requireAuth, generateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { getPatientDateTime } from '../services/escalationService.js';

const router = express.Router();

/**
 * Shared helper to seed realistic clinical demo data for a user
 * Creates Ramesh Sharma (72y), prescriptions, adherence history, active escalation, and appointments.
 */
export async function seedDemoForUser(userId, userRole = 'family') {
  const tzInfo = getPatientDateTime('Asia/Kolkata');
  const today = tzInfo.date;

  // Check if user already has a demo profile named "Ramesh Sharma"
  const existing = db.prepare(`
    SELECT p.id FROM patients p
    JOIN care_circle cc ON p.id = cc.patient_id
    WHERE cc.user_id = ? AND p.full_name = 'Ramesh Sharma'
  `).get(userId);

  if (existing) {
    return existing.id;
  }

  // 1. Create Patient Profile with unique invite code per seed (e.g. SAATHI-DEMO-A1B2)
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const inviteCode = `SAATHI-DEMO-${suffix}`;

  const insertPatient = db.prepare(`
    INSERT INTO patients (
      senior_user_id, full_name, age, gender, blood_group,
      conditions, allergies, emergency_contact_name, emergency_contact_phone,
      emergency_contact_relation, timezone, invite_code
    ) VALUES (?, 'Ramesh Sharma', 72, 'Male', 'B+', 'Type 2 Diabetes, Hypertension, Mild Osteoarthritis', 'Penicillin, Sulfa drugs', 'Priya Sharma (Daughter)', '+91 98765 43210', 'Daughter', 'Asia/Kolkata', ?)
  `).run(userId, inviteCode);

  const patientId = Number(insertPatient.lastInsertRowid);

  // 2. Add Current User to Care Circle
  db.prepare(`
    INSERT INTO care_circle (patient_id, user_id, role, relationship, can_edit, notification_pref)
    VALUES (?, ?, ?, 'Self / Family Caregiver', 1, 'all')
  `).run(patientId, userId, userRole || 'family');

  // Create demo family member (Priya) and demo nurse (Sister Anitha) if not existing
  const priyaPassword = await bcrypt.hash('DemoPass123!', 10);
  const nursePassword = await bcrypt.hash('DemoPass123!', 10);

  let priya = db.prepare("SELECT id FROM users WHERE email = 'priya.sharma.demo@saathicare.health'").get();
  if (!priya) {
    const pRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ('Priya Sharma', 'priya.sharma.demo@saathicare.health', ?, 'family', '+91 98765 43210')
    `).run(priyaPassword);
    priya = { id: Number(pRes.lastInsertRowid) };
  }

  let nurse = db.prepare("SELECT id FROM users WHERE email = 'nurse.anitha.demo@saathicare.health'").get();
  if (!nurse) {
    const nRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ('Sister Anitha Rao', 'nurse.anitha.demo@saathicare.health', ?, 'caregiver', '+91 98111 22334')
    `).run(nursePassword);
    nurse = { id: Number(nRes.lastInsertRowid) };
  }

  // Attach Priya & Nurse to Care Circle
  db.prepare(`
    INSERT OR IGNORE INTO care_circle (patient_id, user_id, role, relationship, can_edit, notification_pref)
    VALUES (?, ?, 'family', 'Daughter', 1, 'all')
  `).run(patientId, priya.id);

  db.prepare(`
    INSERT OR IGNORE INTO care_circle (patient_id, user_id, role, relationship, can_edit, notification_pref)
    VALUES (?, ?, 'caregiver', 'Visiting Nurse', 1, 'all')
  `).run(patientId, nurse.id);

  // 3. Add Realistic Medications
  const med1 = db.prepare(`
    INSERT INTO medications (
      patient_id, name, generic_name, dosage, form, instructions,
      meal_timing, schedule_slots, frequency, inventory_count, refill_alert_threshold, prescribed_by
    ) VALUES (?, 'Metformin 500mg', 'Metformin Hydrochloride', '500 mg', 'Tablet', 'Take right in the middle of your meal with a full glass of water.', 'with_food', '["morning","night"]', 'daily', 24, 6, 'Dr. V. K. Gupta')
  `).run(patientId);

  const med2 = db.prepare(`
    INSERT INTO medications (
      patient_id, name, generic_name, dosage, form, instructions,
      meal_timing, schedule_slots, frequency, inventory_count, refill_alert_threshold, prescribed_by
    ) VALUES (?, 'Amlodipine 5mg', 'Amlodipine Besylate', '5 mg', 'Tablet', 'Take once in the morning. Stand up slowly when getting out of bed.', 'after_food', '["morning"]', 'daily', 18, 5, 'Dr. Rajesh Varma')
  `).run(patientId);

  const med3 = db.prepare(`
    INSERT INTO medications (
      patient_id, name, generic_name, dosage, form, instructions,
      meal_timing, schedule_slots, frequency, inventory_count, refill_alert_threshold, prescribed_by
    ) VALUES (?, 'Atorvastatin 20mg', 'Atorvastatin Calcium', '20 mg', 'Tablet', 'Take at bedtime with water. Protects cholesterol and heart.', 'after_food', '["night"]', 'daily', 28, 5, 'Dr. Rajesh Varma')
  `).run(patientId);

  const m1Id = Number(med1.lastInsertRowid);
  const m2Id = Number(med2.lastInsertRowid);
  const m3Id = Number(med3.lastInsertRowid);

  // 4. Seed 7-Day Adherence History
  for (let i = 6; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];

    // Metformin Morning & Night (taken)
    db.prepare(`
      INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status, taken_at, logged_by_user_id)
      VALUES (?, ?, ?, 'morning', 'taken', ?, ?)
    `).run(patientId, m1Id, dStr, `${dStr}T08:35:00.000Z`, userId);

    db.prepare(`
      INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status, taken_at, logged_by_user_id)
      VALUES (?, ?, ?, 'night', 'taken', ?, ?)
    `).run(patientId, m1Id, dStr, `${dStr}T20:45:00.000Z`, userId);

    // Amlodipine (Day 2 missed, others taken)
    if (i === 2) {
      db.prepare(`
        INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status, notes)
        VALUES (?, ?, ?, 'morning', 'missed', 'Senior forgot during morning garden walk')
      `).run(patientId, m2Id, dStr);
    } else {
      db.prepare(`
        INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status, taken_at, logged_by_user_id)
        VALUES (?, ?, ?, 'morning', 'taken', ?, ?)
      `).run(patientId, m2Id, dStr, `${dStr}T08:50:00.000Z`, userId);
    }

    // Atorvastatin Night (taken)
    db.prepare(`
      INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status, taken_at, logged_by_user_id)
      VALUES (?, ?, ?, 'night', 'taken', ?, ?)
    `).run(patientId, m3Id, dStr, `${dStr}T21:15:00.000Z`, userId);
  }

  // Today's morning Metformin: taken
  db.prepare(`
    INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status, taken_at, logged_by_user_id)
    VALUES (?, ?, ?, 'morning', 'taken', ?, ?)
  `).run(patientId, m1Id, today, `${today}T08:30:00.000Z`, userId);

  // Today's morning Amlodipine: unconfirmed / missed with active escalation
  const escLog = db.prepare(`
    INSERT INTO medication_logs (patient_id, medication_id, scheduled_date, scheduled_slot, status, notes)
    VALUES (?, ?, ?, 'morning', 'missed', 'Unconfirmed 08:00 AM scheduled dose')
  `).run(patientId, m2Id, today);

  // 5. Active Tier 3 Escalation Alert
  const escMsg = `Tier 3 Escalation: Ramesh Sharma has not confirmed Amlodipine 5mg scheduled for MORNING (08:00 AM). Overdue by >90 minutes. Caregivers alerted.`;
  db.prepare(`
    INSERT INTO escalations (patient_id, medication_id, log_id, tier, status, scheduled_time, message, caregivers_notified)
    VALUES (?, ?, ?, 3, 'active', '08:00', ?, 2)
  `).run(patientId, m2Id, escLog.lastInsertRowid, escMsg);

  // In-app alert notification
  db.prepare(`
    INSERT INTO notifications (patient_id, user_id, title, message, type, priority, email_status)
    VALUES (?, ?, '🚨 Caregiver Escalation Alert (Tier 3)', ?, 'escalation', 'critical', 'unconfigured')
  `).run(patientId, userId, escMsg);

  // 6. Upcoming Doctor Appointments
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 4);
  const nextWeekDate = nextWeek.toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO appointments (
      patient_id, doctor_name, specialty, clinic_hospital, address,
      appointment_date, appointment_time, notes, reminder_hours, status
    ) VALUES (?, 'Dr. Rajesh Varma', 'Senior Cardiologist', 'Fortis Escorts Heart Institute', 'Okhla Road, New Delhi', ?, '10:30', 'Routine 3-month blood pressure review and ECG check. Bring recent BP log sheet.', 24, 'upcoming')
  `).run(patientId, nextWeekDate);

  // 7. Activity History Entries
  db.prepare(`
    INSERT INTO activities (patient_id, user_id, action_type, title, details)
    VALUES 
      (?, ?, 'escalation_triggered', 'Tier 3 Escalation: Amlodipine 5mg', 'Unconfirmed morning dose. Care circle notified. Safety rule active: Never double missed dose.'),
      (?, ?, 'medication_taken', 'Dose Confirmed Taken', 'Metformin 500mg taken for MORNING'),
      (?, ?, 'appointment_scheduled', 'Cardiology Consultation Booked', 'Appointment confirmed with Dr. Rajesh Varma for ${nextWeekDate} at 10:30 AM')
  `).run(patientId, userId, patientId, userId, patientId, userId);

  return patientId;
}

/**
 * 1-Click Guest Demo for Evaluators/Judges
 * No registration or prior account required!
 */
router.post('/guest', authRateLimiter, async (req, res) => {
  try {
    const hex8 = crypto.randomBytes(4).toString('hex');
    const email = `guest-${hex8}@demo.saathi.care`;
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const password_hash = await bcrypt.hash(randomPassword, 10);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ('Demo Judge', ?, ?, 'family', '+91 98765 00000')
    `).run(email, password_hash);

    const userId = Number(insertUser.lastInsertRowid);

    const guestUser = {
      id: userId,
      name: 'Demo Judge',
      email,
      role: 'family',
      phone: '+91 98765 00000',
      hasPasscode: false,
    };

    // Seed Ramesh Sharma demo profile for this guest user
    const patientId = await seedDemoForUser(userId, 'family');

    // Generate JWT token
    const token = generateToken(guestUser);

    return res.status(201).json({
      message: 'Guest demo profile initialized',
      token,
      user: guestUser,
      patientId,
    });
  } catch (err) {
    console.error('[Guest Demo Error]:', err);
    return res.status(500).json({ error: 'Failed to initialize guest demo' });
  }
});

/**
 * Seed realistic demo data for authenticated judges
 * Attaches the created demo profile to the currently logged in user!
 */
router.post('/seed', requireAuth, async (req, res) => {
  try {
    const patientId = await seedDemoForUser(req.user.id, req.user.role);
    return res.status(201).json({
      message: 'Demo profile "Ramesh Sharma" successfully seeded with realistic clinical data!',
      patientId,
    });
  } catch (err) {
    console.error('[Demo Seed Error]:', err);
    return res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

/**
 * Remove demo data for current authenticated user
 */
router.post('/reset', requireAuth, (req, res) => {
  try {
    const demo = db.prepare(`
      SELECT p.id FROM patients p
      JOIN care_circle cc ON p.id = cc.patient_id
      WHERE cc.user_id = ? AND (p.invite_code LIKE 'SAATHI-DEMO%' OR p.full_name = 'Ramesh Sharma')
    `).get(req.user.id);

    if (demo) {
      db.prepare('DELETE FROM patients WHERE id = ?').run(demo.id);
    }
    return res.json({ message: 'Demo data removed successfully' });
  } catch (err) {
    console.error('[Demo Reset Error]:', err);
    return res.status(500).json({ error: 'Failed to reset demo data' });
  }
});

export default router;
