import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data directory exists
const dataDir = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH 
  ? path.resolve(process.cwd(), process.env.DB_PATH) 
  : path.join(dataDir, 'saathi_care.db');

console.log(`[Database] Connecting to SQLite persistent database at: ${dbPath}`);
export const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for concurrency and integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialize all database tables and schema
 */
export function initDatabase() {
  db.exec(`
    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      passcode_hash TEXT,
      role TEXT CHECK(role IN ('senior', 'family', 'caregiver')) NOT NULL DEFAULT 'senior',
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Patient Profiles Table
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senior_user_id INTEGER,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT DEFAULT 'Other',
      blood_group TEXT,
      conditions TEXT, -- comma-separated or JSON
      allergies TEXT,    -- comma-separated or JSON
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      emergency_contact_relation TEXT,
      timezone TEXT DEFAULT 'Asia/Kolkata',
      invite_code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (senior_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 3. Care Circle Memberships Table
    CREATE TABLE IF NOT EXISTS care_circle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT CHECK(role IN ('senior', 'family', 'caregiver')) NOT NULL,
      relationship TEXT NOT NULL,
      can_edit INTEGER NOT NULL DEFAULT 1, -- 1=can edit, 0=read only
      notification_pref TEXT DEFAULT 'all', -- 'all', 'escalations_only', 'none'
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(patient_id, user_id),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 4. Medications Table
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      generic_name TEXT,
      dosage TEXT NOT NULL,           -- e.g. "500 mg", "1 tablet"
      form TEXT DEFAULT 'Tablet',     -- Tablet, Capsule, Syrup, Injection, Inhaler, Drops
      instructions TEXT,              -- e.g. "Take with a glass of water after food"
      meal_timing TEXT DEFAULT 'after_food', -- 'before_food', 'after_food', 'with_food', 'anytime'
      schedule_slots TEXT NOT NULL,   -- JSON array: ["morning", "night"] or ["08:00", "20:00"]
      frequency TEXT DEFAULT 'daily', -- 'daily', 'alternate_days', 'weekly', 'as_needed'
      custom_time TEXT,               -- e.g. "14:30" (for non-standard custom timing)
      inventory_count INTEGER DEFAULT 30,
      refill_alert_threshold INTEGER DEFAULT 5,
      prescribed_by TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- 5. Medication Adherence Logs Table (with duplicate guard)
    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      medication_id INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,   -- 'YYYY-MM-DD'
      scheduled_slot TEXT NOT NULL,   -- 'morning', 'afternoon', 'evening', 'night' or '08:00'
      status TEXT CHECK(status IN ('upcoming', 'taken', 'missed', 'skipped')) NOT NULL DEFAULT 'upcoming',
      taken_at DATETIME,
      skipped_reason TEXT,
      logged_by_user_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(patient_id, medication_id, scheduled_date, scheduled_slot),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
      FOREIGN KEY (logged_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 6. Appointments Table
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      clinic_hospital TEXT NOT NULL,
      address TEXT,
      appointment_date TEXT NOT NULL, -- 'YYYY-MM-DD'
      appointment_time TEXT NOT NULL, -- 'HH:MM' (24-hour)
      status TEXT CHECK(status IN ('upcoming', 'completed', 'cancelled')) NOT NULL DEFAULT 'upcoming',
      notes TEXT,
      reminder_hours INTEGER DEFAULT 24,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- 7. Escalations & Unconfirmed Dose Alerts Table
    CREATE TABLE IF NOT EXISTS escalations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      medication_id INTEGER NOT NULL,
      log_id INTEGER,
      tier INTEGER NOT NULL DEFAULT 1, -- 1=Gentle Reminder, 2=Follow-up Warning, 3=Caregiver Alert
      status TEXT CHECK(status IN ('active', 'acknowledged', 'resolved')) NOT NULL DEFAULT 'active',
      scheduled_time TEXT,
      message TEXT NOT NULL,
      caregivers_notified INTEGER DEFAULT 0,
      notified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      resolved_by_user_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
      FOREIGN KEY (log_id) REFERENCES medication_logs(id) ON DELETE SET NULL,
      FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 8. Notifications Table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      user_id INTEGER, -- target recipient, or NULL for all care circle members
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT CHECK(type IN ('dose_reminder', 'dose_missed', 'escalation', 'appointment', 'care_circle', 'refill')) NOT NULL,
      priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')) NOT NULL DEFAULT 'medium',
      is_read INTEGER NOT NULL DEFAULT 0,
      email_status TEXT CHECK(email_status IN ('sent', 'unconfigured', 'failed', 'not_applicable')) DEFAULT 'not_applicable',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 9. Activity Timeline Audit Log Table
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      user_id INTEGER,
      action_type TEXT NOT NULL, -- 'medication_taken', 'medication_missed', 'escalation_triggered', 'appointment_booked', etc.
      title TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Indices for quick query performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(invite_code);
    CREATE INDEX IF NOT EXISTS idx_meds_patient ON medications(patient_id);
    CREATE INDEX IF NOT EXISTS idx_logs_date ON medication_logs(patient_id, scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_appts_date ON appointments(patient_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_activities_patient ON activities(patient_id, created_at);
  `);

  // Safe schema migrations for existing databases
  try {
    db.exec('ALTER TABLE medications ADD COLUMN custom_time TEXT;');
  } catch (_) {
    // Column already exists
  }

  console.log('[Database] Schema verified and initialized successfully.');
}
