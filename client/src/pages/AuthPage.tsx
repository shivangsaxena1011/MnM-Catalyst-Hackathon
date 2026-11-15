import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake, KeyRound, Mail, Lock, User, ArrowLeft, Shield } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, onSuccess }) => {
  const { login, passcodeLogin, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'passcode' | 'register'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'senior' | 'family' | 'caregiver'>('senior');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await passcodeLogin({ email, passcode });
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="text-center">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-700/20 mb-3">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E33] tracking-tight">
            {tab === 'register' ? 'Create Your Account' : 'Welcome to SAATHI CARE'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {tab === 'passcode'
              ? 'Elder-friendly 4-digit PIN access'
              : tab === 'register'
              ? 'Join the Care Circle as Senior, Family, or Caregiver'
              : 'Sign in to monitor medications and appointments'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-slate-200/80 rounded-3xl">
          
          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`py-2 rounded-xl transition-all ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('passcode'); setError(null); }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1 ${
                tab === 'passcode' ? 'bg-amber-100 text-amber-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
              <span>PIN / Passcode</span>
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              className={`py-2 rounded-xl transition-all ${
                tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl p-3.5 font-medium flex items-start space-x-2">
              <Shield className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Standard Password Login */}
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Tab 2: Elder Quick Passcode Login */}
          {tab === 'passcode' && (
            <form onSubmit={handlePasscodeLogin} className="space-y-4">
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs text-amber-900 mb-4">
                👵 <strong>Elder Easy Access:</strong> Enter your account email and 4-digit numeric PIN for quick sign-in without a complicated password.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. senior@saathicare.health"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  placeholder="1 2 3 4"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Verifying PIN...' : 'Verify PIN & Enter'}
              </button>
            </form>
          )}

          {/* Tab 3: Register New User */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Role *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'senior', label: 'Senior' },
                    { id: 'family', label: 'Family' },
                    { id: 'caregiver', label: 'Caregiver' },
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as any)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        role === r.id
                          ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">4-Digit PIN (Optional)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={passcode}
                    onChange={e => setPasscode(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
