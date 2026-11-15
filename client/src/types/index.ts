export type UserRole = 'senior' | 'family' | 'caregiver';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  hasPasscode?: boolean;
}

export interface Patient {
  id: number;
  senior_user_id?: number | null;
  full_name: string;
  age: number;
  gender: string;
  blood_group?: string | null;
  conditions?: string | null;
  allergies?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  timezone?: string;
  invite_code: string;
  created_at: string;
  circle_role?: UserRole;
  relationship?: string;
  can_edit?: number;
  active_meds_count?: number;
  active_escalations_count?: number;
}

export interface CareCircleMember {
  membership_id: number;
  role: UserRole;
  relationship: string;
  can_edit: number;
  notification_pref: string;
  joined_at: string;
  user_id: number;
  name: string;
  email: string;
  phone?: string | null;
}

export type MedicationSlot = 'morning' | 'afternoon' | 'evening' | 'night' | string;

export type MealTiming = 'before_food' | 'after_food' | 'with_food' | 'anytime';

export interface Medication {
  id: number;
  patient_id: number;
  name: string;
  generic_name?: string | null;
  dosage: string;
  form: string;
  instructions?: string | null;
  meal_timing: MealTiming;
  schedule_slots: MedicationSlot[];
  frequency: string;
  inventory_count: number;
  refill_alert_threshold: number;
  prescribed_by?: string | null;
  is_active: number;
  created_at: string;
}

export type DoseStatus = 'upcoming' | 'taken' | 'missed' | 'skipped';

export interface MedicationLog {
  id: number | null;
  patient_id: number;
  medication_id: number;
  medication_name: string;
  dosage: string;
  form?: string;
  instructions?: string | null;
  meal_timing?: string;
  scheduled_date: string;
  scheduled_slot: MedicationSlot;
  status: DoseStatus;
  taken_at?: string | null;
  skipped_reason?: string | null;
  logged_by_name?: string | null;
  notes?: string | null;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_name: string;
  specialty: string;
  clinic_hospital: string;
  address?: string | null;
  appointment_date: string;
  appointment_time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string | null;
  reminder_hours: number;
  created_at: string;
}

export interface Escalation {
  id: number;
  patient_id: number;
  medication_id: number;
  log_id?: number | null;
  tier: number;
  status: 'active' | 'acknowledged' | 'resolved';
  scheduled_time: string;
  message: string;
  caregivers_notified: number;
  notified_at: string;
  resolved_at?: string | null;
  resolved_by_name?: string | null;
  notes?: string | null;
  medication_name: string;
  dosage: string;
  form: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  patient_id: number;
  user_id?: number | null;
  title: string;
  message: string;
  type: 'dose_reminder' | 'dose_missed' | 'escalation' | 'appointment' | 'care_circle' | 'refill';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: number;
  email_status: 'sent' | 'unconfigured' | 'failed' | 'not_applicable';
  created_at: string;
}

export interface ActivityItem {
  id: number;
  patient_id: number;
  user_id?: number | null;
  user_name?: string | null;
  user_role?: UserRole | null;
  action_type: string;
  title: string;
  details?: string | null;
  created_at: string;
}

export interface AdherenceDayStat {
  date: string;
  day: string;
  taken: number;
  missed: number;
  skipped: number;
  rate: number;
}

export interface AdherenceStats {
  overallAdherenceRate: number;
  totalDoses: number;
  totalTaken: number;
  totalMissed: number;
  totalSkipped: number;
  trendData: AdherenceDayStat[];
  slotStats: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}
