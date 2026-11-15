import {
  User, Patient, CareCircleMember, Medication, MedicationLog,
  Appointment, Escalation, NotificationItem, ActivityItem, AdherenceStats
} from '../types';

const API_BASE = '/api';

/**
 * Fetch wrapper with JWT Authorization header
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('saathi_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    register: (payload: { name: string; email: string; password: string; passcode?: string; role: string; phone?: string }) =>
      request<{ token: string; user: User; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    login: (payload: { email: string; password: string }) =>
      request<{ token: string; user: User; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    passcodeLogin: (payload: { email: string; passcode: string }) =>
      request<{ token: string; user: User; message: string }>('/auth/passcode-login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    me: () => request<{ user: User; patients: Patient[] }>('/auth/me'),
    setPasscode: (passcode: string) =>
      request<{ message: string }>('/auth/set-passcode', {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      }),
  },

  // Patients & Care Circle
  patients: {
    create: (payload: Partial<Patient> & { relationship?: string }) =>
      request<{ message: string; patient: Patient; invite_code: string }>('/patients', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    join: (payload: { invite_code: string; relationship?: string }) =>
      request<{ message: string; patient: Patient }>('/patients/join', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    list: () => request<{ patients: Patient[] }>('/patients'),
    get: (patientId: number) =>
      request<{
        patient: Patient;
        care_circle: CareCircleMember[];
        current_user_permissions: { role: string; can_edit: boolean };
      }>(`/patients/${patientId}`),
    update: (patientId: number, payload: Partial<Patient>) =>
      request<{ message: string; patient: Patient }>(`/patients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    updateMemberPermission: (patientId: number, memberId: number, payload: { can_edit?: boolean; role?: string; relationship?: string }) =>
      request<{ message: string }>(`/patients/${patientId}/care-circle/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    removeMember: (patientId: number, memberId: number) =>
      request<{ message: string }>(`/patients/${patientId}/care-circle/${memberId}`, {
        method: 'DELETE',
      }),
  },

  // Medications
  medications: {
    list: (patientId: number) =>
      request<{ medications: Medication[] }>(`/medications/${patientId}`),
    create: (patientId: number, payload: Partial<Medication>) =>
      request<{ message: string; medication: Medication }>(`/medications/${patientId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (patientId: number, medId: number, payload: Partial<Medication>) =>
      request<{ message: string; medication: Medication }>(`/medications/${patientId}/${medId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (patientId: number, medId: number) =>
      request<{ message: string }>(`/medications/${patientId}/${medId}`, {
        method: 'DELETE',
      }),
  },

  // Adherence Logs
  logs: {
    getScheduleAndLogs: (patientId: number, date?: string) =>
      request<{ date: string; schedule: MedicationLog[]; logs: MedicationLog[] }>(
        `/logs/${patientId}${date ? `?date=${date}` : ''}`
      ),
    recordStatus: (
      patientId: number,
      payload: {
        medication_id: number;
        scheduled_date: string;
        scheduled_slot: string;
        status: 'taken' | 'missed' | 'skipped' | 'upcoming';
        skipped_reason?: string;
        notes?: string;
      }
    ) =>
      request<{ message: string; log: MedicationLog }>(`/logs/${patientId}/log`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getAdherenceStats: (patientId: number) =>
      request<AdherenceStats>(`/logs/${patientId}/adherence-stats`),
  },

  // Appointments
  appointments: {
    list: (patientId: number) =>
      request<{ appointments: Appointment[]; upcoming: Appointment[]; past: Appointment[] }>(
        `/appointments/${patientId}`
      ),
    create: (patientId: number, payload: Partial<Appointment>) =>
      request<{ message: string; appointment: Appointment }>(`/appointments/${patientId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (patientId: number, apptId: number, payload: Partial<Appointment>) =>
      request<{ message: string; appointment: Appointment }>(`/appointments/${patientId}/${apptId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (patientId: number, apptId: number) =>
      request<{ message: string }>(`/appointments/${patientId}/${apptId}`, {
        method: 'DELETE',
      }),
  },

  // Escalations
  escalations: {
    list: (patientId: number) =>
      request<{ escalations: Escalation[]; active: Escalation[]; resolved: Escalation[] }>(
        `/escalations/${patientId}`
      ),
    scan: (patientId: number) =>
      request<{ message: string; escalationsTriggered: any[] }>(`/escalations/${patientId}/scan`, {
        method: 'POST',
      }),
    simulate: (patientId: number, payload: { medication_id?: number; slot?: string; tier?: number }) =>
      request<{ message: string; escalationId: number; notifiedCount: number }>(`/escalations/${patientId}/simulate`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    resolve: (patientId: number, escalationId: number, notes?: string) =>
      request<{ message: string }>(`/escalations/${patientId}/${escalationId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
  },

  // Timeline
  timeline: {
    list: (patientId: number, action_type?: string) =>
      request<{ events: ActivityItem[] }>(
        `/timeline/${patientId}${action_type ? `?action_type=${action_type}` : ''}`
      ),
  },

  // Notifications
  notifications: {
    list: (patientId: number) =>
      request<{ notifications: NotificationItem[]; unreadCount: number; smtpConfigured: boolean }>(
        `/notifications/${patientId}`
      ),
    markRead: (patientId: number, notifId: number) =>
      request<{ message: string }>(`/notifications/${patientId}/${notifId}/read`, {
        method: 'PATCH',
      }),
    markAllRead: (patientId: number) =>
      request<{ message: string }>(`/notifications/${patientId}/read-all`, {
        method: 'POST',
      }),
  },

  // AI Care Assistant
  ai: {
    explain: (payload: { query: string; patient_id?: number }) =>
      request<{ source: string; answer: string; disclaimer: string }>('/ai/explain', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Judge Demo Data
  demo: {
    seed: () =>
      request<{ message: string; patientId: number }>('/demo/seed', {
        method: 'POST',
      }),
    reset: () =>
      request<{ message: string }>('/demo/reset', {
        method: 'POST',
      }),
  },
};
