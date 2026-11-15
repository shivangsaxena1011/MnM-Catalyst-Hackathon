import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Appointment } from '../types';
import { AddAppointmentModal } from '../components/AddAppointmentModal';
import {
  Calendar, Plus, Clock, MapPin, CheckCircle2,
  XCircle, Edit2, Trash2, CalendarDays
} from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const { activePatient } = useAuth();
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const res = await api.appointments.list(activePatient.id);
      setUpcoming(res.upcoming || []);
      setPast(res.past || []);
    } catch (err) {
      console.error('[Load Appointments Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [activePatient]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleSaveAppointment = async (payload: Partial<Appointment>) => {
    if (!activePatient) return;
    if (editingAppt) {
      await api.appointments.update(activePatient.id, editingAppt.id, payload);
    } else {
      await api.appointments.create(activePatient.id, payload);
    }
    await loadAppointments();
  };

  const handleDelete = async (apptId: number) => {
    if (!activePatient) return;
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await api.appointments.delete(activePatient.id, apptId);
      await loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete appointment');
    }
  };

  const handleUpdateStatus = async (appt: Appointment, newStatus: 'completed' | 'cancelled') => {
    if (!activePatient) return;
    try {
      await api.appointments.update(activePatient.id, appt.id, { status: newStatus });
      await loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1E33]">Appointment Guardian</h1>
          <p className="text-xs text-slate-500 font-medium">
            Doctor visits, hospital consultations, and automated reminders for {activePatient?.full_name}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAppt(null);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-700/20 flex items-center space-x-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Visit</span>
        </button>
      </div>

      {/* Upcoming Appointments */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <CalendarDays className="w-5 h-5 text-teal-600" />
          <span>Upcoming Consultations</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading appointments...</div>
        ) : upcoming.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No upcoming visits scheduled</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Keep care circles informed before checkups</p>
            <button
              onClick={() => {
                setEditingAppt(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
            >
              + Schedule Visit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(appt => (
              <div
                key={appt.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-900 px-2.5 py-1 rounded-full">
                      {appt.specialty}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingAppt(appt);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(appt.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{appt.doctor_name}</h3>
                  <div className="text-xs font-semibold text-slate-600 mt-0.5">{appt.clinic_hospital}</div>

                  {appt.address && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{appt.address}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl mt-3">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>{appt.appointment_date} at {appt.appointment_time}</span>
                  </div>

                  {appt.notes && (
                    <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong>Notes:</strong> {appt.notes}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Reminder: {appt.reminder_hours}h before
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(appt, 'completed')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(appt, 'cancelled')}
                      className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments History */}
      {past.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-base font-bold text-slate-700">Past Consultations</h2>
          <div className="space-y-2">
            {past.map(p => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 text-xs flex items-center justify-between opacity-80"
              >
                <div>
                  <span className="font-bold text-slate-900">{p.doctor_name}</span> ({p.specialty}) • {p.clinic_hospital}
                  <div className="text-slate-400 mt-0.5">{p.appointment_date} at {p.appointment_time}</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                    p.status === 'completed'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {modalOpen && (
        <AddAppointmentModal
          initialAppt={editingAppt}
          onClose={() => {
            setModalOpen(false);
            setEditingAppt(null);
          }}
          onSave={handleSaveAppointment}
        />
      )}

    </div>
  );
};
