import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useElderMode } from '../context/ElderModeContext';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import {
  Settings, Accessibility, KeyRound, Mail, Sparkles,
  Trash2, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { useFeedback } from '../components/ui/FeedbackProvider';

export const SettingsPage: React.FC = () => {
  const { notify, confirm: confirmAction } = useFeedback();
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
      notify('Passcode must be at least 4 digits', 'error');
      return;
    }
    setPasscodeLoading(true);
    setPasscodeMsg(null);
    try {
      await api.auth.setPasscode(passcode);
      setPasscodeMsg('Security PIN updated successfully');
      setPasscode('');
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Failed to update passcode'), 'error');
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
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Failed to seed demo data'), 'error');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!(await confirmAction({ title: 'Reset demo profile?', message: 'Reset judge demo profile data?', confirmLabel: 'Reset', destructive: true }))) return;
    setDemoLoading(true);
    setDemoMsg(null);
    try {
      const res = await api.demo.reset();
      await refreshPatients();
      setDemoMsg(res.message);
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Failed to reset demo data'), 'error');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-serif">Platform Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Accessibility preferences, passcode security, and judge evaluation tools
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Section 1: Accessibility & Elder Mode */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-amber-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Accessibility className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">Accessibility & Vision Comfort</h2>
              <p className="text-xs text-slate-500">Elder-friendly high-contrast layout and text-to-speech audio</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/50">
            <div>
              <div className="font-bold text-slate-900 text-sm">Elder-Friendly Mode</div>
              <p className="text-xs text-slate-600 max-w-md mt-0.5">
                Increases button sizes, switches to single-dose giant view, enlarges typography to 20px+, and disables motion.
              </p>
            </div>

            <button
              onClick={toggleElderMode}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                isElderMode
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-amber-300 text-slate-800 hover:bg-amber-50'
              }`}
            >
              {isElderMode ? 'Active (Turn Off)' : 'Enable Elder View'}
            </button>
          </div>
        </div>

        {/* Section 2: Security & 4-Digit Passcode */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-amber-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">Passcode Security (Bcrypt Hashed)</h2>
              <p className="text-xs text-slate-500">Update your 4-digit numeric PIN for instant passwordless elder login</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePasscode} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New 4-Digit Security PIN</label>
              <input
                type="password"
                maxLength={6}
                required
                value={passcode}
                onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 1234"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-mono tracking-widest bg-white"
              />
            </div>

            {passcodeMsg && (
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                ✓ {passcodeMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={passcodeLoading}
              className="px-5 py-2.5 rounded-2xl signature-btn text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
            >
              {passcodeLoading ? 'Updating...' : 'Update Security PIN'}
            </button>
          </form>
        </div>

        {/* Section 3: Judge Demo Seeder */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-amber-100">
            <div className="w-10 h-10 rounded-2xl signature-gradient text-white flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">Hackathon Demonstration Tools</h2>
              <p className="text-xs text-slate-500">Seed realistic elder profile (Ramesh Sharma, 72y) with 7-day adherence and active escalation</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Judges can populate or reset demo data anytime. The demo profile includes realistic prescriptions (Amlodipine, Metformin, Atorvastatin), complete 7-day adherence history, an upcoming Cardiology visit, and an active Tier 3 Escalation alert.
            </p>

            {demoMsg && (
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                {demoMsg}
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleSeedDemo}
                disabled={demoLoading}
                className="px-5 py-2.5 rounded-2xl signature-btn text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{demoLoading ? 'Loading...' : 'Seed Judge Demo Profile'}</span>
              </button>

              <button
                onClick={handleResetDemo}
                disabled={demoLoading}
                className="px-4 py-2.5 rounded-2xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Demo Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Project & Developer Attribution */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-amber-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">About SAATHI CARE</h2>
              <p className="text-xs text-slate-500">Engineering credits & platform version</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/50">
            <div>
              <div className="font-bold text-slate-900 text-sm">Developed by Shivang Saxena</div>
              <p className="text-xs text-slate-600 mt-0.5">
                PromptWars × Catalyst Hackathon MVP • MIT Licensed
              </p>
            </div>
            <div className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl self-start sm:self-center">
              v1.0.0 Production
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SettingsPage;
