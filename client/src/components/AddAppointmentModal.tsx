import React, { useState } from 'react';
import { Appointment } from '../types';
import { X, Calendar } from 'lucide-react';

interface AddAppointmentModalProps {
  initialAppt?: Appointment | null;
  onClose: () => void;
  onSave: (payload: Partial<Appointment>) => Promise<void>;
}

export const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({ initialAppt, onClose, onSave }) => {
  const [doctorName, setDoctorName] = useState(initialAppt?.doctor_name || '');
  const [specialty, setSpecialty] = useState(initialAppt?.specialty || '');
  const [clinicHospital, setClinicHospital] = useState(initialAppt?.clinic_hospital || '');
  const [address, setAddress] = useState(initialAppt?.address || '');
  const [appointmentDate, setAppointmentDate] = useState(
    initialAppt?.appointment_date || new Date().toISOString().split('T')[0]
  );
  const [appointmentTime, setAppointmentTime] = useState(initialAppt?.appointment_time || '10:00');
  const [notes, setNotes] = useState(initialAppt?.notes || '');
  const [reminderHours, setReminderHours] = useState<number>(initialAppt?.reminder_hours ?? 24);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !specialty.trim() || !clinicHospital.trim()) {
      alert('Please fill in doctor name, specialty, and clinic/hospital');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        doctor_name: doctorName.trim(),
        specialty: specialty.trim(),
        clinic_hospital: clinicHospital.trim(),
        address: address.trim() || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        notes: notes.trim() || null,
        reminder_hours: Number(reminderHours),
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0B1E33]">
              {initialAppt ? 'Edit Appointment' : 'Schedule Appointment'}
            </h3>
            <p className="text-xs text-slate-500">
              Appointment Guardian will remind authorized family and senior
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name *</label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Varma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Specialty *</label>
              <input
                type="text"
                required
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                placeholder="e.g. Cardiologist, Physician"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinic / Hospital *</label>
              <input
                type="text"
                required
                value={clinicHospital}
                onChange={e => setClinicHospital(e.target.value)}
                placeholder="e.g. Fortis Escorts Hospital"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Address / Location</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Okhla Road, New Delhi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time *</label>
              <input
                type="time"
                required
                value={appointmentTime}
                onChange={e => setAppointmentTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remind Ahead</label>
              <select
                value={reminderHours}
                onChange={e => setReminderHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              >
                <option value={2}>2 hours before</option>
                <option value={6}>6 hours before</option>
                <option value={24}>24 hours before</option>
                <option value={48}>48 hours before</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Bring recent blood sugar report, fast for 8 hours prior"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#0D9488] hover:bg-[#0F766E] text-white shadow-lg shadow-teal-700/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : initialAppt ? 'Save Changes' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
