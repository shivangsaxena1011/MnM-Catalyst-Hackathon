import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { MedicationLog, Escalation, Appointment, ActivityItem, AdherenceStats } from '../types';
import { DoseActionModal } from '../components/DoseActionModal';
import {
  Pill, Clock, ShieldAlert, CheckCircle2,
  Calendar, Users, ArrowUpRight, Check, X,
  PhoneCall, HeartPulse, RefreshCw
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onOpenAi: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenAi }) => {
  const { activePatient } = useAuth();

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<MedicationLog[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [adherenceStats, setAdherenceStats] = useState<AdherenceStats | null>(null);

  // Selected item for Dose Action Modal
  const [selectedDose, setSelectedDose] = useState<MedicationLog | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [scheduleRes, escRes, apptRes, timelineRes, statsRes] = await Promise.all([
        api.logs.getScheduleAndLogs(activePatient.id, today),
        api.escalations.list(activePatient.id),
        api.appointments.list(activePatient.id),
        api.timeline.list(activePatient.id),
        api.logs.getAdherenceStats(activePatient.id),
      ]);

      setSchedule(scheduleRes.schedule || []);
      setEscalations(escRes.active || []);
      setAppointments(apptRes.upcoming || []);
      setActivities(timelineRes.events || []);
      setAdherenceStats(statsRes);
    } catch (err) {
      console.error('[Dashboard Load Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [activePatient]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleConfirmDose = async (status: 'taken' | 'skipped', reason?: string, notes?: string) => {
    if (!selectedDose || !activePatient) return;
    await api.logs.recordStatus(activePatient.id, {
      medication_id: selectedDose.medication_id,
      scheduled_date: selectedDose.scheduled_date,
      scheduled_slot: selectedDose.scheduled_slot,
      status,
      skipped_reason: reason,
      notes,
    });
    await loadDashboardData();
  };

  const handleResolveEscalation = async (escId: number) => {
    if (!activePatient) return;
    try {
      await api.escalations.resolve(activePatient.id, escId, 'Resolved from dashboard follow-up');
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve escalation');
    }
  };

  if (!activePatient) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4">
          <Pill className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">No Patient Profile Selected</h3>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Create a profile for an elderly loved one or join their Care Circle using an invite code.
        </p>
        <button
          onClick={() => onNavigate('onboarding')}
          className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Create or Join Care Circle
        </button>
      </div>
    );
  }

  const takenCount = schedule.filter(s => s.status === 'taken').length;
  const totalDosesToday = schedule.length;
  const pendingCount = schedule.filter(s => s.status === 'upcoming' || s.status === 'missed').length;

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-[#0B1E33] via-[#0F2942] to-[#133E5C] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30 mb-2">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>ACTIVE CARE CIRCLE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {activePatient.full_name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Age {activePatient.age} • Blood Group {activePatient.blood_group || 'N/A'} • {activePatient.conditions || 'Routine Wellness Care'}
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => onNavigate('elder')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span>👵 Switch to Elder View</span>
            </button>
            <button
              onClick={loadDashboardData}
              title="Refresh Dashboard"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Escalation Alerts (Safety Priority) */}
      {escalations.length > 0 && (
        <div className="space-y-3">
          {escalations.map(esc => (
            <div
              key={esc.id}
              className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 shadow-md animate-in fade-in"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                        Tier {esc.tier} Escalation
                      </span>
                      <span className="text-xs font-bold text-rose-700">Scheduled: {esc.scheduled_time}</span>
                    </div>
                    <h3 className="text-base font-bold text-rose-950 mt-1">{esc.message}</h3>
                    <p className="text-xs text-rose-800 mt-1 font-medium">
                      🛡️ <strong>Safety Rule:</strong> Never instruct patient to double their missed dose. Continue with next scheduled dose.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleResolveEscalation(esc.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    Mark Followed Up / Resolved
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Adherence Rate */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>7-Day Adherence</span>
            <span className="text-teal-600">Rate</span>
          </div>
          <div className="text-3xl font-extrabold text-[#0B1E33]">
            {adherenceStats ? `${adherenceStats.overallAdherenceRate}%` : '100%'}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {adherenceStats?.totalTaken || 0} taken of {adherenceStats?.totalDoses || 0} scheduled
          </div>
        </div>

        {/* Today's Remaining */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Today's Doses</span>
            <span className="text-teal-600">Progress</span>
          </div>
          <div className="text-3xl font-extrabold text-[#0B1E33]">
            {takenCount} / {totalDosesToday}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {pendingCount === 0 ? 'All doses taken today 🎉' : `${pendingCount} dose(s) pending`}
          </div>
        </div>

        {/* Active Escalations */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Active Alerts</span>
            <span className={escalations.length > 0 ? 'text-rose-600 font-black' : 'text-emerald-600'}>Status</span>
          </div>
          <div className={`text-3xl font-extrabold ${escalations.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {escalations.length}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {escalations.length > 0 ? 'Requires caregiver check' : 'Routine running smoothly'}
          </div>
        </div>

        {/* Next Appointment */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Next Doctor Visit</span>
            <span className="text-teal-600">Guardian</span>
          </div>
          <div className="text-lg font-extrabold text-[#0B1E33] truncate">
            {appointments.length > 0 ? appointments[0].doctor_name : 'No appointments'}
          </div>
          <div className="text-xs text-slate-500 font-medium truncate">
            {appointments.length > 0 ? `${appointments[0].appointment_date} (${appointments[0].appointment_time})` : 'Schedule regular checkups'}
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule + Care Circle & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Schedule */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B1E33]">Today’s Medication Schedule</h2>
              <p className="text-xs text-slate-500 font-medium">Real-time confirmation prevents duplicate doses</p>
            </div>
            <button
              onClick={() => onNavigate('medications')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center space-x-1"
            >
              <span>Manage Prescriptions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {schedule.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80">
              <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No medications scheduled for today</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Add your prescriptions to start tracking adherence</p>
              <button
                onClick={() => onNavigate('medications')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
              >
                + Add Medication
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((item, idx) => {
                const isTaken = item.status === 'taken';
                const isMissed = item.status === 'missed';
                const isSkipped = item.status === 'skipped';

                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-3xl p-5 border transition-all ${
                      isTaken
                        ? 'border-emerald-200/90 bg-emerald-50/20'
                        : isMissed
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-200/80 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                            isTaken
                              ? 'bg-emerald-600 text-white'
                              : isMissed
                              ? 'bg-rose-600 text-white'
                              : isSkipped
                              ? 'bg-amber-500 text-white'
                              : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          {isTaken ? <Check className="w-6 h-6" /> : isMissed ? <X className="w-6 h-6" /> : <Pill className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                              {item.scheduled_slot}
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                              {item.meal_timing ? item.meal_timing.replace('_', ' ') : 'After food'}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 mt-1">
                            {item.medication_name} <span className="text-sm font-semibold text-slate-500">({item.dosage})</span>
                          </h3>

                          {item.instructions && (
                            <p className="text-xs text-slate-600 mt-0.5 font-normal">
                              {item.instructions}
                            </p>
                          )}

                          {isTaken && item.taken_at && (
                            <p className="text-xs text-emerald-700 font-semibold mt-1">
                              ✓ Confirmed taken at {new Date(item.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}

                          {isSkipped && (
                            <p className="text-xs text-amber-700 font-semibold mt-1">
                              ⚠️ Skipped: {item.skipped_reason || 'No reason provided'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        {!isTaken ? (
                          <>
                            <button
                              onClick={() => setSelectedDose(item)}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Take Dose</span>
                            </button>
                            <button
                              onClick={() => setSelectedDose(item)}
                              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                            >
                              Skip
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                            Dose Complete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Emergency & Care Circle & Appointments */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Emergency Contact Quick Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Emergency Contact</span>
              <PhoneCall className="w-4 h-4 text-rose-500" />
            </h3>
            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100">
              <div className="font-bold text-slate-900 text-sm">{activePatient.emergency_contact_name || 'Family Contact'}</div>
              <div className="text-xs text-slate-600">{activePatient.emergency_contact_relation || 'Caregiver'}</div>
              <div className="text-sm font-bold text-rose-700 mt-1">
                {activePatient.emergency_contact_phone || 'Add phone in settings'}
              </div>
            </div>
          </div>

          {/* Upcoming Appointment */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Doctor Visit</h3>
              <button
                onClick={() => onNavigate('appointments')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800"
              >
                View All
              </button>
            </div>

            {appointments.length > 0 ? (
              <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{appointments[0].doctor_name}</span>
                  <span className="text-[11px] font-bold bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full">
                    {appointments[0].specialty}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-medium">{appointments[0].clinic_hospital}</div>
                <div className="text-xs font-bold text-teal-800 flex items-center space-x-1 pt-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>{appointments[0].appointment_date} at {appointments[0].appointment_time}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No upcoming appointments scheduled</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Care Events</h3>
              <button
                onClick={() => onNavigate('timeline')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800"
              >
                Full Timeline
              </button>
            </div>

            <div className="space-y-2.5">
              {activities.slice(0, 4).map(act => (
                <div key={act.id} className="text-xs border-b border-slate-100 pb-2 last:border-none last:pb-0">
                  <div className="font-bold text-slate-800">{act.title}</div>
                  <div className="text-slate-500 line-clamp-1">{act.details}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Modal for Confirming/Skipping Dose */}
      {selectedDose && (
        <DoseActionModal
          item={selectedDose}
          onClose={() => setSelectedDose(null)}
          onConfirm={handleConfirmDose}
        />
      )}

    </div>
  );
};
