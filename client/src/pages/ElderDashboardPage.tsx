import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useElderMode } from '../context/ElderModeContext';
import { api } from '../api/client';
import { MedicationLog } from '../types';
import { getErrorMessage } from '../utils/error';
import {
  Volume2, Check, X, PhoneCall, Heart,
  ShieldCheck, Clock, Utensils
} from 'lucide-react';
import { useFeedback } from '../components/ui/FeedbackProvider';

interface ElderDashboardPageProps {
  onBackToStandard: () => void;
  onOpenAi: () => void;
}

export const ElderDashboardPage: React.FC<ElderDashboardPageProps> = ({ onBackToStandard, onOpenAi }) => {
  const { notify, confirm: confirmAction } = useFeedback();
  const { activePatient } = useAuth();
  const { speak } = useElderMode();

  const [schedule, setSchedule] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDoseIndex, setActiveDoseIndex] = useState(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    const foodGuidance = currentDose.meal_timing 
      ? `Please take this ${currentDose.meal_timing.replace('_', ' ')}.` 
      : 'Please take this with a full glass of water.';
    const textToSpeak = `Namaste ${activePatient?.full_name || ''}. It is time for your ${currentDose.scheduled_slot} medicine: ${currentDose.medication_name}, dosage ${currentDose.dosage}. ${foodGuidance} ${currentDose.instructions || ''}. Tap the big green button below once you have swallowed it.`;
    
    setIsSpeaking(true);
    speak(textToSpeak);
    setTimeout(() => setIsSpeaking(false), 6500);
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
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Failed to record dose'), 'error');
    }
  };

  const handleSkipDose = async () => {
    if (!currentDose || !activePatient) return;
    if (!(await confirmAction({ title: 'Skip this medicine?', message: `Are you sure you want to skip ${currentDose.medication_name}? Never take double on your next dose.`, confirmLabel: 'Yes, skip it', destructive: true }))) return;

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
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Failed to record dose'), 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      
      {/* Top Elder Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-amber-300">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 font-serif">
            Namaste, {activePatient?.full_name || 'Friend'} 🙏
          </h1>
          <p className="text-lg font-bold text-teal-800 mt-1">
            Today's Care Companion • Safe, Simple & Clear
          </p>
        </div>

        <button
          onClick={onBackToStandard}
          className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-400 hover:border-slate-600 text-slate-900 font-extrabold text-sm shadow-sm transition-all cursor-pointer"
        >
          Exit to Standard View
        </button>
      </div>

      {actionMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-5 rounded-2xl bg-emerald-100 border-3 border-emerald-500 text-emerald-950 text-xl font-black text-center shadow-md"
        >
          {actionMessage}
        </div>
      )}

      {/* Main Focus: Giant Single-Dose Card */}
      {loading ? (
        <div className="py-20 text-center text-slate-700 text-2xl font-bold">
          Checking your pill schedule...
        </div>
      ) : schedule.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-4 border-slate-300 space-y-4 shadow-sm">
          <Heart className="w-20 h-20 text-emerald-600 mx-auto" />
          <h2 className="text-3xl font-black text-slate-950 font-serif">No Pills Scheduled Today</h2>
          <p className="text-xl text-slate-700 font-bold">Enjoy your peaceful day and stay well hydrated!</p>
        </div>
      ) : !currentDose || schedule.every(s => s.status === 'taken' || s.status === 'skipped') ? (
        <div className="bg-emerald-50 rounded-3xl p-12 text-center border-4 border-emerald-400 space-y-5 shadow-lg">
          <div className="w-24 h-24 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-5xl font-black shadow-md">
            ✓
          </div>
          <h2 className="text-4xl font-black text-emerald-950 font-serif">All Done For Today!</h2>
          <p className="text-2xl text-emerald-900 font-bold max-w-lg mx-auto leading-relaxed">
            All your scheduled medications for today have been confirmed. Your family and caregivers have been updated.
          </p>
          <div className="pt-4">
            <button
              onClick={() => speak('All your pills for today have been completed. Great job!')}
              className="px-8 py-4 rounded-2xl bg-white text-emerald-950 border-3 border-emerald-500 font-black text-xl flex items-center justify-center space-x-3 mx-auto shadow-md cursor-pointer"
            >
              <Volume2 className="w-7 h-7 text-emerald-700" />
              <span>Listen Aloud</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-4 border-teal-600 shadow-xl space-y-8">
          
          {/* Slot Header + Read Aloud */}
          <div className="flex items-center justify-between pb-5 border-b-2 border-slate-200">
            <span className="text-lg font-black uppercase tracking-wider bg-teal-100 text-teal-950 px-5 py-2 rounded-full border border-teal-300">
              {currentDose.scheduled_slot.toUpperCase()} DOSE
            </span>

            <button
              onClick={handleReadAloud}
              className="flex items-center space-x-2.5 px-5 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-base border-2 border-amber-400 transition-all cursor-pointer shadow-xs"
            >
              <Volume2 className={`w-6 h-6 text-amber-800 ${isSpeaking ? 'animate-bounce text-rose-600' : ''}`} />
              <span>{isSpeaking ? 'Speaking...' : 'Read Aloud'}</span>
            </button>
          </div>

          {/* Giant Medicine Name (40px+) */}
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              {/* Pill Colour Swatch */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center text-2xl font-black shadow-md">
                💊
              </div>
              <div>
                <h2 className="text-4xl sm:text-5xl font-black text-slate-950 leading-tight font-serif">
                  {currentDose.medication_name}
                </h2>
                <div className="text-2xl font-black text-teal-800 mt-1">
                  Dosage: {currentDose.dosage} ({currentDose.form || 'Tablet'})
                </div>
              </div>
            </div>
          </div>

          {/* Food Instructions with Icon */}
          <div className="p-6 bg-amber-50/80 rounded-2xl border-3 border-amber-300 text-xl text-slate-900 font-bold leading-relaxed space-y-2">
            <div className="flex items-center space-x-3 text-amber-900 font-black">
              <Utensils className="w-6 h-6 text-amber-700" />
              <span>Meal Timing: {currentDose.meal_timing ? currentDose.meal_timing.replace('_', ' ').toUpperCase() : 'AFTER FOOD'}</span>
            </div>
            {currentDose.instructions && (
              <p className="text-lg text-slate-800 font-medium pt-1">
                {currentDose.instructions}
              </p>
            )}
          </div>

          {/* Massive 80px+ Confirmation Button */}
          <div className="space-y-4 pt-2">
            <button
              onClick={handleConfirmTaken}
              style={{ minHeight: '84px' }}
              className="w-full py-6 px-8 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xl sm:text-3xl shadow-xl shadow-emerald-700/30 flex items-center justify-center space-x-4 transition-all cursor-pointer active:scale-98"
            >
              <Check className="w-10 h-10 stroke-[3.5]" />
              <span>YES, I TOOK THIS PILL</span>
            </button>

            <button
              onClick={handleSkipDose}
              style={{ minHeight: '56px' }}
              className="w-full py-4 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg border-2 border-slate-300 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
              <span>Not Now / Skip This Dose</span>
            </button>
          </div>

          {/* Clinical Safety Protocol notice */}
          <div className="p-4 bg-teal-50 rounded-2xl border-2 border-teal-300 text-sm text-teal-950 font-bold flex items-center space-x-3">
            <ShieldCheck className="w-6 h-6 text-teal-700 shrink-0" />
            <span>Safety Protocol: Never take a double dose to make up for a missed one.</span>
          </div>

        </div>
      )}

      {/* Emergency & Family Call Bar (Always Visible at Bottom) */}
      <div className="p-6 bg-rose-50 rounded-3xl border-3 border-rose-400 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <PhoneCall className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xl font-black text-rose-950 font-serif">
              Need Help? Call Family
            </div>
            <div className="text-base font-bold text-rose-800">
              {activePatient?.emergency_contact_name || 'Emergency Contact'}:{' '}
              {activePatient?.emergency_contact_phone || 'Not configured'}
            </div>
          </div>
        </div>

        {activePatient?.emergency_contact_phone && (
          <a
            href={`tel:${activePatient.emergency_contact_phone}`}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xl shadow-lg flex items-center justify-center space-x-3 transition-all"
          >
            <PhoneCall className="w-6 h-6" />
            <span>Call Now</span>
          </a>
        )}
      </div>

    </div>
  );
};

export default ElderDashboardPage;
