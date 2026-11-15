import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useElderMode } from '../context/ElderModeContext';
import { api } from '../api/client';
import { MedicationLog, Escalation, Appointment, ActivityItem, AdherenceStats, Medication } from '../types';
import { DoseActionModal } from '../components/DoseActionModal';
import confetti from 'canvas-confetti';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Pill, Clock, ShieldAlert, CheckCircle2,
  Calendar, Users, ArrowUpRight, Check, X,
  PhoneCall, HeartPulse, RefreshCw, AlertTriangle,
  Sparkles, PackageCheck
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onOpenAi: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenAi }) => {
  const { activePatient } = useAuth();
  const { isElderMode } = useElderMode();

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<MedicationLog[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [adherenceStats, setAdherenceStats] = useState<AdherenceStats | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);

  // Selected item for Dose Action Modal
  const [selectedDose, setSelectedDose] = useState<MedicationLog | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [scheduleRes, escRes, apptRes, timelineRes, statsRes, medsRes] = await Promise.all([
        api.logs.getScheduleAndLogs(activePatient.id, today),
        api.escalations.list(activePatient.id),
        api.appointments.list(activePatient.id),
        api.timeline.list(activePatient.id),
        api.logs.getAdherenceStats(activePatient.id),
        api.medications.list(activePatient.id),
      ]);

      setSchedule(scheduleRes.schedule || []);
      setEscalations(escRes.active || []);
      setAppointments(apptRes.upcoming || []);
      setActivities(timelineRes.events || []);
      setAdherenceStats(statsRes);
      setMedications(medsRes.medications || []);
    } catch (err) {
      console.error('[Dashboard Load Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [activePatient]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Dynamic time-of-day greeting + emoji
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
    if (hour < 17) return { text: 'Good afternoon', emoji: '🌤️' };
    return { text: 'Good evening', emoji: '🌙' };
  }, []);

  // Today formatted warmly
  const formattedToday = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  }, []);

  // Countdown string for next doctor appointment
  const nextApptCountdown = useMemo(() => {
    if (appointments.length === 0) return null;
    const next = appointments[0];
    const apptTime = new Date(`${next.appointment_date}T${next.appointment_time || '09:00'}:00`).getTime();
    const now = Date.now();
    const diffMs = apptTime - now;
    if (diffMs < 0) return 'Today / In Progress';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remHours = diffHours % 24;
    if (diffDays > 0) return `in ${diffDays}d ${remHours}h`;
    return `in ${diffHours} hours`;
  }, [appointments]);

  // Low stock medications
  const lowStockMeds = useMemo(() => {
    return medications.filter(m => m.inventory_count <= m.refill_alert_threshold && m.inventory_count > 0);
  }, [medications]);

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

    // Celebrate with confetti on dose taken unless in elder mode / reduced motion
    if (status === 'taken' && !isElderMode) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#14B8A6', '#FDBA74', '#FB7185', '#10B981'],
        });
      } catch (_) {}
    }

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
      <div className="glass-card p-10 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-3xl signature-gradient text-white flex items-center justify-center mx-auto shadow-md">
          <Pill className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 font-serif">No Patient Profile Selected</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          Create a profile for an elderly loved one or join their Care Circle using an invite code.
        </p>
        <button
          onClick={() => onNavigate('onboarding')}
          className="px-6 py-3 rounded-2xl signature-btn text-white font-bold text-sm shadow-md cursor-pointer"
        >
          Create or Join Care Circle
        </button>
      </div>
    );
  }

  const takenCount = schedule.filter(s => s.status === 'taken').length;
  const totalDosesToday = schedule.length;
  const pendingCount = schedule.filter(s => s.status === 'upcoming' || s.status === 'missed').length;
  const adherenceRate = adherenceStats ? adherenceStats.overallAdherenceRate : (totalDosesToday > 0 ? Math.round((takenCount / totalDosesToday) * 100) : 100);

  // SVG Circular progress ring calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (adherenceRate / 100) * circumference;

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Card with Warm Premium Look */}
      <div className="glass-card p-6 sm:p-8 bg-gradient-to-r from-white/95 via-amber-50/40 to-teal-50/50 border border-amber-200/70 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100/80 text-teal-900 text-xs font-bold border border-teal-200/60 mb-2">
              <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
              <span>ACTIVE CARE CIRCLE • {activePatient.invite_code}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              {timeGreeting.text}, {activePatient.full_name} {timeGreeting.emoji}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {formattedToday} • Age {activePatient.age} • Blood Group {activePatient.blood_group || 'B+'} • {activePatient.conditions || 'Routine Wellness Care'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('elder')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span>👵 Switch to Elder View</span>
            </button>
            <button
              onClick={loadDashboardData}
              title="Refresh Dashboard"
              className="p-2.5 rounded-2xl bg-white border border-amber-200/80 hover:bg-amber-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Escalation Alerts (Critical Safety Priority) */}
      {escalations.length > 0 && (
        <div className="space-y-3">
          {escalations.map(esc => (
            <div
              key={esc.id}
              className="glass p-5 rounded-3xl border-2 border-rose-300 bg-rose-50/90 shadow-md animate-pulse"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black uppercase tracking-wider bg-rose-200 text-rose-900 px-2.5 py-0.5 rounded-full">
                        Tier {esc.tier} Escalation Alert
                      </span>
                      <span className="text-xs font-bold text-rose-700">Scheduled: {esc.scheduled_time}</span>
                    </div>
                    <h3 className="text-base font-bold text-rose-950 mt-1">{esc.message}</h3>
                    <p className="text-xs text-rose-800 mt-1 font-medium">
                      🛡️ <strong>Clinical Safety Rule:</strong> Never instruct patient to double their missed dose. Continue with next scheduled dose.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleResolveEscalation(esc.id)}
                    className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Mark Followed Up / Resolved
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Low Stock Refill Alert Cards */}
      {lowStockMeds.length > 0 && (
        <div className="glass p-4 rounded-3xl border border-amber-300 bg-amber-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <PackageCheck className="w-5 h-5 text-amber-700" />
            <div>
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">Refill Alert: </span>
              <span className="text-xs text-amber-800 font-medium">
                {lowStockMeds.map(m => `${m.name} (${m.inventory_count} pills left)`).join(', ')}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('medications')}
            className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            Manage Stock
          </button>
        </div>
      )}

      {/* Metrics Row: Circular Adherence Ring + KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Circular Adherence Progress */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">7-Day Adherence</div>
            <div className="text-3xl font-extrabold text-slate-900 font-serif">
              {adherenceRate}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {adherenceStats?.totalTaken || takenCount} taken of {adherenceStats?.totalDoses || totalDosesToday} scheduled
            </div>
          </div>

          {/* SVG Animated Circular Ring */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-amber-100"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="transition-all duration-1000 ease-out"
                stroke="url(#adherenceGradient)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
              <defs>
                <linearGradient id="adherenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14B8A6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800">
              {adherenceRate}%
            </div>
          </div>
        </div>

        {/* Metric 2: Today's Progress */}
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Today's Doses</span>
            <span className="text-teal-600 font-bold">Progress</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-serif">
            {takenCount} / {totalDosesToday}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {pendingCount === 0 ? 'All doses taken today 🎉' : `${pendingCount} dose(s) pending`}
          </div>
          {/* Progress Mini Bar */}
          <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full signature-gradient transition-all duration-500"
              style={{ width: `${totalDosesToday > 0 ? (takenCount / totalDosesToday) * 100 : 100}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Active Alerts */}
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Active Alerts</span>
            <span className={escalations.length > 0 ? 'text-rose-600 font-black' : 'text-emerald-600 font-bold'}>
              {escalations.length > 0 ? 'Urgent' : 'Clear'}
            </span>
          </div>
          <div className={`text-3xl font-extrabold font-serif ${escalations.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {escalations.length}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {escalations.length > 0 ? 'Caregiver follow-up needed' : 'Routine running smoothly'}
          </div>
        </div>

        {/* Metric 4: Next Appointment Countdown */}
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Next Doctor Visit</span>
            <span className="text-teal-600 font-bold">{nextApptCountdown || 'Guardian'}</span>
          </div>
          <div className="text-lg font-extrabold text-slate-900 truncate font-serif">
            {appointments.length > 0 ? appointments[0].doctor_name : 'None Scheduled'}
          </div>
          <div className="text-xs text-slate-500 font-medium truncate">
            {appointments.length > 0 ? `${appointments[0].appointment_date} (${appointments[0].appointment_time})` : 'Schedule regular checkups'}
          </div>
        </div>

      </div>

      {/* Main Grid: Today's Schedule + Side Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Schedule */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 font-serif">Today’s Medication Schedule</h2>
              <p className="text-xs text-slate-500 font-medium">Real-time confirmation prevents duplicate doses</p>
            </div>
            <button
              onClick={() => onNavigate('medications')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage Prescriptions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {schedule.length === 0 ? (
            <div className="glass-card p-10 text-center space-y-3">
              <Pill className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-800 font-serif">No medications scheduled for today</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add prescriptions with morning, afternoon, or evening timing to track daily adherence.
              </p>
              <button
                onClick={() => onNavigate('medications')}
                className="px-5 py-2.5 rounded-2xl signature-btn text-white text-xs font-bold shadow-xs cursor-pointer"
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
                    className={`glass-card p-5 transition-all ${
                      isTaken
                        ? 'border-emerald-300/80 bg-emerald-50/30'
                        : isMissed
                        ? 'border-rose-300 bg-rose-50/40'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-xs ${
                            isTaken
                              ? 'bg-emerald-600 text-white'
                              : isMissed
                              ? 'bg-rose-600 text-white'
                              : isSkipped
                              ? 'bg-amber-500 text-white'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {isTaken ? <Check className="w-6 h-6" /> : isMissed ? <X className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                              {item.scheduled_slot}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
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
                              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Take Dose</span>
                            </button>
                            <button
                              onClick={() => setSelectedDose(item)}
                              className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                            >
                              Skip
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3.5 py-1.5 rounded-full flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Dose Complete</span>
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

        {/* Right Column: Emergency + Doctor Consultation + Recent Events */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Emergency Contact Card */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Emergency Contact</span>
              <PhoneCall className="w-4 h-4 text-rose-500" />
            </h3>
            <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200/80 space-y-0.5">
              <div className="font-bold text-slate-900 text-sm">{activePatient.emergency_contact_name || 'Family Contact'}</div>
              <div className="text-xs text-slate-600">{activePatient.emergency_contact_relation || 'Caregiver'}</div>
              <div className="text-sm font-extrabold text-rose-700 pt-1">
                {activePatient.emergency_contact_phone || 'Add phone in settings'}
              </div>
            </div>
          </div>

          {/* Next Consultation Card */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next Doctor Visit</h3>
              <button
                onClick={() => onNavigate('appointments')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                View All
              </button>
            </div>

            {appointments.length > 0 ? (
              <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{appointments[0].doctor_name}</span>
                  <span className="text-[10px] font-bold bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full">
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

          {/* Recent Activity Mini Timeline */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Care Events</h3>
              <button
                onClick={() => onNavigate('timeline')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                Full Timeline
              </button>
            </div>

            <div className="space-y-2.5">
              {activities.slice(0, 4).map(act => (
                <div key={act.id} className="text-xs border-b border-amber-100 pb-2 last:border-none last:pb-0">
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

export default DashboardPage;
