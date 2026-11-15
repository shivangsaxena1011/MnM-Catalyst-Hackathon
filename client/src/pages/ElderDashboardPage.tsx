import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useElderMode } from '../context/ElderModeContext';
import { api } from '../api/client';
import { MedicationLog } from '../types';
import {
  Volume2, Check, X, PhoneCall, Heart,
  Sparkles, ShieldCheck, Clock
} from 'lucide-react';

interface ElderDashboardPageProps {
  onBackToStandard: () => void;
  onOpenAi: () => void;
}

export const ElderDashboardPage: React.FC<ElderDashboardPageProps> = ({ onBackToStandard, onOpenAi }) => {
  const { activePatient } = useAuth();
  const { speak } = useElderMode();

  const [schedule, setSchedule] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDoseIndex, setActiveDoseIndex] = useState(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.logs.getScheduleAndLogs(activePatient.id, today);
      const pendingOrToday = res.schedule || [];
      setSchedule(pendingOrToday);

      // Find first unconfirmed dose
      const firstPending = pendingOrToday.findIndex(s => s.status === 'upcoming' || s.status === 'missed');
      if (firstPending !== -1) {
        setActiveDoseIndex(firstPending);
      }
    } catch (err) {
      console.error('[Elder Schedule Load Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [activePatient]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const currentDose: MedicationLog | undefined = schedule[activeDoseIndex];

  const handleReadAloud = () => {
    if (!currentDose) {
      speak('You have taken all your medicines for today. Great job!');
      return;
    }
    const textToSpeak = `Hello ${activePatient?.full_name || ''}. It is time for your ${currentDose.scheduled_slot} medicine: ${currentDose.medication_name}, ${currentDose.dosage}. ${currentDose.instructions || ''}. Please take this with a full glass of water.`;
    speak(textToSpeak);
  };

  const handleConfirmTaken = async () => {
    if (!currentDose || !activePatient) return;
    try {
      await api.logs.recordStatus(activePatient.id, {
        medication_id: currentDose.medication_id,
        scheduled_date: currentDose.scheduled_date,
        scheduled_slot: currentDose.scheduled_slot,
        status: 'taken',
        notes: 'Confirmed via Elder-Friendly Mode',
      });
      speak('Wonderful! I have recorded your medicine as taken and notified your family.');
      setActionMessage(`✅ Confirmed: ${currentDose.medication_name} recorded as taken!`);
      setTimeout(() => setActionMessage(null), 4000);
      await loadSchedule();
    } catch (err: any) {
      alert(err.message || 'Failed to record dose');
    }
  };

  const handleSkipDose = async () => {
    if (!currentDose || !activePatient) return;
    if (!window.confirm(`Are you sure you want to skip ${currentDose.medication_name}? Never take double on your next dose.`)) return;

    try {
      await api.logs.recordStatus(activePatient.id, {
        medication_id: currentDose.medication_id,
        scheduled_date: currentDose.scheduled_date,
        scheduled_slot: currentDose.scheduled_slot,
        status: 'skipped',
        skipped_reason: 'Skipped via Elder Mode',
      });
      speak('Understood. Dose marked as skipped. Please do not take a double dose later.');
      setActionMessage(`⚠️ Marked as skipped. Remember: Never double your next dose.`);
      setTimeout(() => setActionMessage(null), 4000);
      await loadSchedule();
    } catch (err: any) {
      alert(err.message || 'Failed to record dose');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      
      {/* Top Elder Header */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-200">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1E33] tracking-tight">
            Namaste, {activePatient?.full_name || 'Friend'}
          </h1>
          <p className="text-base font-semibold text-emerald-800 mt-1">
            Today's Care Companion • Safe & Simple
          </p>
        </div>

        <button
          onClick={onBackToStandard}
          className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-sm shadow-sm transition-all"
        >
          Exit to Standard View
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-950 text-lg font-bold text-center animate-in fade-in">
          {actionMessage}
        </div>
      )}

      {/* Main Focus: Current Dose Card */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xl font-bold">Checking your pill schedule...</div>
      ) : schedule.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border-4 border-slate-200 space-y-4">
          <Heart className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-black text-slate-900">No Pills Scheduled Today</h2>
          <p className="text-lg text-slate-600">Enjoy your day and stay well hydrated!</p>
        </div>
      ) : !currentDose || schedule.every(s => s.status === 'taken' || s.status === 'skipped') ? (
        <div className="bg-emerald-50 rounded-3xl p-10 text-center border-4 border-emerald-300 space-y-4 shadow-lg">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-md">
            ✓
          </div>
          <h2 className="text-3xl font-black text-emerald-950">All Done For Today!</h2>
          <p className="text-xl text-emerald-800 font-semibold max-w-md mx-auto">
            All your scheduled medications for today have been confirmed. Your family and caregivers have been updated.
          </p>
          <div className="pt-4">
            <button
              onClick={() => speak('All your pills for today have been completed. Great job!')}
              className="px-6 py-3 rounded-2xl bg-white text-emerald-900 border-2 border-emerald-400 font-bold text-base flex items-center justify-center space-x-2 mx-auto cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
              <span>Listen</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-4 border-teal-500 shadow-xl space-y-6">
          
          {/* Slot Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-base font-black uppercase tracking-wider bg-teal-100 text-teal-950 px-4 py-1.5 rounded-full">
              {currentDose.scheduled_slot.toUpperCase()} DOSE
            </span>

            <button
              onClick={handleReadAloud}
              className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-sm border border-amber-300 transition-all cursor-pointer"
            >
              <Volume2 className="w-5 h-5 text-amber-800" />
              <span>Read Aloud</span>
            </button>
          </div>

          {/* Huge Drug Title */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B1E33] leading-tight">
              {currentDose.medication_name}
            </h2>
            <div className="inline-block bg-teal-50 text-teal-900 text-xl font-bold px-4 py-1.5 rounded-xl border border-teal-200">
              Dosage: {currentDose.dosage} ({currentDose.form || 'Tablet'})
            </div>
          </div>

          {/* Doctor Instructions in large clear text */}
          {currentDose.instructions && (
            <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 text-lg text-slate-800 font-medium leading-relaxed">
              <strong>Instructions:</strong> {currentDose.instructions}
              {currentDose.meal_timing && (
                <div className="text-teal-800 font-bold mt-1">
                  Timing: {currentDose.meal_timing.replace('_', ' ')}
                </div>
              )}
            </div>
          )}

          {/* Oversized Confirm / Skip Buttons */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleConfirmTaken}
              className="py-5 px-6 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl shadow-xl shadow-emerald-700/30 flex items-center justify-center space-x-3 transition-all cursor-pointer"
            >
              <Check className="w-8 h-8 stroke-[3]" />
              <span>YES, I TOOK THIS PILL</span>
            </button>

            <button
              onClick={handleSkipDose}
              className="py-5 px-6 rounded-3xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-lg border-2 border-slate-300 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <X className="w-6 h-6 stroke-[3]" />
              <span>I Am Skipping This Dose</span>
            </button>
          </div>

          {/* Safety Warning */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-xs sm:text-sm text-amber-950 font-bold flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Important: Never take a double dose to make up for a missed one.</span>
          </div>

        </div>
      )}

      {/* Emergency & Family Call Bar */}
      <div className="p-6 bg-rose-50 rounded-3xl border-2 border-rose-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-bold text-rose-950">
              Need Help? Call Family
            </div>
            <div className="text-sm font-semibold text-rose-800">
              {activePatient?.emergency_contact_name || 'Emergency Contact'}:{' '}
              {activePatient?.emergency_contact_phone || 'Not configured'}
            </div>
          </div>
        </div>

        {activePatient?.emergency_contact_phone && (
          <a
            href={`tel:${activePatient.emergency_contact_phone}`}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-base shadow-md flex items-center justify-center space-x-2 transition-all"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call Now</span>
          </a>
        )}
      </div>

    </div>
  );
};
