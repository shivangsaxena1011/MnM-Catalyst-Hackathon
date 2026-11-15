import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Appointment } from '../types';
import { AddAppointmentModal } from '../components/AddAppointmentModal';
import { getErrorMessage } from '../utils/error';
import {
  Calendar, Plus, Clock, MapPin, CheckCircle2,
  XCircle, Edit2, Trash2, CalendarDays
} from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const { activePatient } = useAuth();
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
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
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to delete appointment'));
    }
  };

  const handleUpdateStatus = async (appt: Appointment, newStatus: 'completed' | 'cancelled') => {
    if (!activePatient) return;
    try {
      await api.appointments.update(activePatient.id, appt.id, { status: newStatus });
      await loadAppointments();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to update status'));
    }
  };

  const parseDateBadge = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();
      return { month, day };
    } catch (_) {
      return { month: 'Date', day: '•' };
    }
  };

  const activeList = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-serif">Appointment Guardian</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Doctor visits, hospital consultations, and automated 24h reminders for {activePatient?.full_name}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAppt(null);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl signature-btn text-white font-bold text-sm shadow-md flex items-center space-x-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Visit</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 bg-amber-50/80 p-1.5 rounded-2xl w-fit border border-amber-200/60 text-xs font-bold">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            tab === 'upcoming' ? 'bg-white text-teal-950 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Upcoming Consultations ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            tab === 'past' ? 'bg-white text-teal-950 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Consultation History ({past.length})
        </button>
      </div>

      {/* Appointment Cards */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-xs">Loading appointments...</div>
      ) : activeList.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-lg mx-auto space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 font-serif">
            {tab === 'upcoming' ? 'No Upcoming Visits Scheduled' : 'No Past Consultations'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {tab === 'upcoming'
              ? 'Schedule doctor consultations to trigger 24-hour reminders for the care circle.'
              : 'Completed visits will appear here with clinical consultation notes.'}
          </p>
          {tab === 'upcoming' && (
            <button
              onClick={() => {
                setEditingAppt(null);
                setModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-2xl signature-btn text-white text-xs font-bold cursor-pointer"
            >
              + Schedule Visit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeList.map(appt => {
            const { month, day } = parseDateBadge(appt.appointment_date);
            const isCompleted = appt.status === 'completed';
            const isCancelled = appt.status === 'cancelled';

            return (
              <div
                key={appt.id}
                className="glass-card p-6 glass-card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    {/* Calendar Badge */}
                    <div className="w-14 h-16 rounded-2xl bg-gradient-to-b from-[#14B8A6] to-[#0F766E] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="text-[10px] uppercase font-bold tracking-wider">{month}</span>
                      <span className="text-2xl font-black leading-none">{day}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-900 border border-teal-200/60 px-2.5 py-0.5 rounded-full">
                          {appt.specialty}
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Completed
                          </span>
                        )}
                        {isCancelled && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                            Cancelled
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 font-serif mt-1">{appt.doctor_name}</h3>
                      <p className="text-xs text-slate-600 font-medium flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{appt.clinic_hospital}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAppt(appt);
                          setModalOpen(true);
                        }}
                        aria-label={`Edit consultation with ${appt.doctor_name}`}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        title="Edit Consultation"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(appt.id)}
                        aria-label={`Delete consultation with ${appt.doctor_name}`}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Consultation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Consultation Time & Address */}
                  <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-200/50 space-y-1 text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{appt.appointment_time}</span>
                    </div>
                    {appt.address && (
                      <p className="text-slate-500">{appt.address}</p>
                    )}
                    {appt.notes && (
                      <p className="text-slate-600 italic pt-1 border-t border-amber-200/40">"{appt.notes}"</p>
                    )}
                  </div>
                </div>

                {/* Footer Status Actions */}
                {tab === 'upcoming' && (
                  <div className="pt-4 mt-4 border-t border-amber-100 flex items-center justify-between">
                    <span className="text-[11px] text-teal-800 font-bold">
                      📧 24h Email Reminder Active
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(appt, 'completed')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(appt, 'cancelled')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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

export default AppointmentsPage;
