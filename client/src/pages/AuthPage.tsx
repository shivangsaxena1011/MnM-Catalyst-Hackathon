import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, Lock, User, ArrowLeft, Shield, CheckCircle2, Pill, Heart } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, onSuccess }) => {
  const { login, passcodeLogin, register, loginAsGuest } = useAuth();
  const [tab, setTab] = useState<'login' | 'passcode' | 'register'>('passcode');
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuestDemo = async () => {
    setGuestLoading(true);
    setError(null);
    try {
      await loginAsGuest();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to start demo');
      setGuestLoading(false);
    }
  };

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'senior' | 'family' | 'caregiver'>('senior');

  // 4-Digit PIN individual boxes
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = cleanVal;
    setPinDigits(newDigits);
    const fullPin = newDigits.join('');
    setPasscode(fullPin);

    // Auto-advance to next box if filled
    if (cleanVal && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const pinToUse = passcode || pinDigits.join('');
      await passcodeLogin({ email, passcode: pinToUse });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Passcode verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        passcode: passcode || undefined,
        role,
        phone: phone || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F1] flex text-slate-800">
      
      {/* Left Aurora Brand Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-[#0F766E] via-[#14B8A6] to-[#FB7185] p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center space-x-3">
          <img src="/logo-icon.png" alt="SAATHI CARE" className="w-10 h-10 object-contain drop-shadow-sm" />
          <span className="font-extrabold text-2xl tracking-tight">SAATHI CARE</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md">
            <Heart className="w-8 h-8 fill-white/80" />
          </div>
          <h1 className="text-4xl font-extrabold font-serif leading-tight">
            Safe medication care. <br />
            Zero complications.
          </h1>
          <p className="text-teal-50 text-sm leading-relaxed max-w-sm">
            Whether you are a senior managing daily doses with a 4-digit PIN, or an authorized family member monitoring adherence from afar, SAATHI CARE protects every step.
          </p>

          <div className="pt-2 space-y-3 text-xs font-semibold text-teal-100">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>4-Digit PIN Elder-Friendly Access</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>3-Tier Autonomous Escalation Engine</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>Never Doubles a Missed Dose</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-teal-100/80">
          PromptWars × Catalyst MVP • Healthcare Platform
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-12 relative overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          
          {/* Back button */}
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <img
                src="/logo.png"
                alt="SAATHI CARE - AI-Powered Eldercare"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-xs"
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              {tab === 'register' ? 'Create Your Account' : tab === 'passcode' ? 'Elder Quick Access' : 'Sign In with Password'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              {tab === 'passcode'
                ? 'Elder-friendly 4-digit PIN access without passwords'
                : tab === 'register'
                ? 'Join as Senior, Family Member, or Nurse Caregiver'
                : 'Sign in to monitor medications and appointments'}
            </p>
          </div>

          <div className="glass-card p-6 sm:p-8">
            
            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-amber-50/80 p-1 rounded-2xl mb-6 text-xs font-bold border border-amber-200/60">
              <button
                type="button"
                onClick={() => { setTab('passcode'); setError(null); }}
                className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  tab === 'passcode' ? 'bg-white text-teal-950 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                <span>PIN Access</span>
              </button>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(null); }}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  tab === 'login' ? 'bg-white text-teal-950 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(null); }}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  tab === 'register' ? 'bg-white text-teal-950 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl p-3.5 font-bold flex items-start space-x-2">
                <Shield className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Tab 1: Elder Quick Passcode Login with 4 Large Digit Boxes */}
            {tab === 'passcode' && (
              <form onSubmit={handlePasscodeLogin} className="space-y-4">
                <div className="bg-teal-50/80 rounded-2xl p-3 border border-teal-200 text-xs text-teal-950">
                  👵 <strong>Elder Easy Access:</strong> Enter your email and 4-digit numeric PIN for instant sign-in.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. senior@saathicare.health"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">4-Digit Security PIN</label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[0, 1, 2, 3].map(idx => (
                      <input
                        key={idx}
                        ref={pinInputRefs[idx]}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={pinDigits[idx]}
                        onChange={e => handleDigitChange(idx, e.target.value)}
                        onKeyDown={e => handleKeyDown(idx, e)}
                        className="w-full h-14 text-center text-2xl font-black rounded-2xl border-2 border-amber-300 bg-white focus:border-teal-600 focus:outline-none shadow-2xs"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || pinDigits.some(d => !d)}
                  className="w-full py-3.5 rounded-2xl signature-btn text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? 'Verifying PIN...' : 'Sign In with 4-Digit PIN'}
                </button>
              </form>
            )}

            {/* Tab 2: Standard Password Login */}
            {tab === 'login' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. senior@saathicare.health"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl signature-btn text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In with Password'}
                </button>
              </form>
            )}

            {/* Tab 3: Register Account */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full pl-10 pr-3.5 py-2 rounded-2xl border border-slate-200 text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm bg-white font-medium"
                  >
                    <option value="senior">Senior (Managing my own care)</option>
                    <option value="family">Family Member (Son, Daughter, Spouse)</option>
                    <option value="caregiver">Professional Caregiver / Nurse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. ramesh@gmail.com"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    4-Digit Security PIN <span className="text-slate-400 font-normal">(For quick elder sign-in)</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={passcode}
                    onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm bg-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl signature-btn text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 mt-1"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

          </div>

          {/* Guest Demo link */}
          <div className="mt-6 text-center">
            <button
              onClick={handleGuestDemo}
              disabled={guestLoading || loading}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <span className="text-slate-500 font-normal">Just exploring?</span>
              <span className="underline underline-offset-2">
                {guestLoading ? "Preparing Ramesh's care profile…" : "Try the demo →"}
              </span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AuthPage;
