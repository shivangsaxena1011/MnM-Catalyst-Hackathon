import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useElderMode } from '../context/ElderModeContext';
import { api } from '../api/client';
import {
  Settings, Accessibility, KeyRound, Mail, Sparkles,
  Trash2, ShieldCheck, HeartHandshake
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, activePatient, refreshPatients } = useAuth();
  const { isElderMode, toggleElderMode } = useElderMode();

  const [passcode, setPasscode] = useState('');
  const [passcodeMsg, setPasscodeMsg] = useState<string | null>(null);
  const [passcodeLoading, setPasscodeLoading] = useState(false);

  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMsg, setDemoMsg] = useState<string | null>(null);

  const handleUpdatePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode || passcode.length < 4) {
      alert('Passcode must be at least 4 digits');
      return;
    }
    setPasscodeLoading(true);
    setPasscodeMsg(null);
    try {
      await api.auth.setPasscode(passcode);
      setPasscodeMsg('Security PIN updated successfully');
      setPasscode('');
    } catch (err: any) {
      alert(err.message || 'Failed to update passcode');
    } finally {
      setPasscodeLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setDemoLoading(true);
    setDemoMsg(null);
    try {
      const res = await api.demo.seed();
      await refreshPatients();
      setDemoMsg(res.message);
    } catch (err: any) {
      alert(err.message || 'Failed to seed demo data');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset judge demo profile data?')) return;
    setDemoLoading(true);
    setDemoMsg(null);
    try {
      const res = await api.demo.reset();
      await refreshPatients();
      setDemoMsg(res.message);
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo data');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1E33]">Platform & Safety Settings</h1>
        <p className="text-xs text-slate-500 font-medium">
          Configure elder accessibility, quick security PIN, email notifications, and evaluator demo data
        </p>
      </div>

      {/* 1. Elder-Friendly Mode Preference */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Accessibility className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Elder-Friendly Accessibility Mode</h3>
              <p className="text-xs text-slate-500">
                Oversized buttons, 1.3x - 1.5x font sizes, high-contrast palette, and simplified focus
              </p>
            </div>
          </div>

          <button
            onClick={toggleElderMode}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isElderMode
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isElderMode ? 'Active (ON)' : 'Disabled (OFF)'}
          </button>
        </div>
      </div>

      {/* 2. Security PIN / Passcode Management */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Quick Security PIN (4-Digit Passcode)</h3>
            <p className="text-xs text-slate-500">
              Allows the senior to sign into their dashboard using a simple 4-digit PIN instead of entering a password
            </p>
          </div>
        </div>

        {passcodeMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
            {passcodeMsg}
          </div>
        )}

        <form onSubmit={handleUpdatePasscode} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <input
            type="password"
            maxLength={6}
            required
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            placeholder="Enter new 4-digit PIN"
            className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={passcodeLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {passcodeLoading ? 'Updating...' : 'Set / Update PIN'}
          </button>
        </form>
      </div>

      {/* 3. Honest Email Notifications (Nodemailer) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Nodemailer Email Notification Engine</h3>
            <p className="text-xs text-slate-500">
              Dispatches real HTML notifications to authorized family and caregivers during Tier 3 dose escalations
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="font-semibold text-slate-900">Configuration Variables (server/.env):</div>
          <code className="block bg-slate-900 text-teal-300 p-3 rounded-xl font-mono text-[11px] leading-relaxed">
            SMTP_HOST=smtp.gmail.com<br />
            SMTP_PORT=587<br />
            SMTP_USER=your-email@gmail.com<br />
            SMTP_PASS=your-app-password<br />
            SMTP_FROM="SAATHI CARE &lt;notifications@saathicare.health&gt;"
          </code>
          <p className="text-slate-500 pt-1">
            If SMTP environment variables are unconfigured, the system safely falls back to recording all caregiver alerts in the in-app notification center.
          </p>
        </div>
      </div>

      {/* 4. Judge Demo Data Options (Prompt Requirement) */}
      <div className="bg-gradient-to-r from-slate-900 to-[#0B1E33] text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold border border-teal-400/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Hackathon Judge Demo Data Options</h3>
            <p className="text-xs text-slate-300">
              Instantly seed or reset an authentic elderly clinical case ("Ramesh Sharma", 72, Type 2 Diabetes & Hypertension)
            </p>
          </div>
        </div>

        {demoMsg && (
          <div className="p-3 bg-teal-500/20 border border-teal-400/30 text-teal-200 rounded-xl text-xs font-semibold">
            {demoMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleSeedDemo}
            disabled={demoLoading}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>{demoLoading ? 'Processing...' : 'Load Judge Demo Profile (Ramesh Sharma)'}</span>
          </button>

          <button
            onClick={handleResetDemo}
            disabled={demoLoading}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-rose-900/50 hover:bg-rose-900 text-rose-200 border border-rose-700/50 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Demo Profile</span>
          </button>
        </div>
      </div>

    </div>
  );
};
