import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useElderMode } from '../context/ElderModeContext';
import {
  HeartHandshake, Bell, Sparkles, LogOut,
  ChevronDown, Accessibility, PlusCircle
} from 'lucide-react';
import { api } from '../api/client';

interface NavbarProps {
  onOpenAi: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAi, onNavigate, currentPage }) => {
  const { user, patients, activePatient, selectPatient, logout } = useAuth();
  const { isElderMode, toggleElderMode } = useElderMode();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [patientMenuOpen, setPatientMenuOpen] = useState(false);

  useEffect(() => {
    if (activePatient) {
      api.notifications.list(activePatient.id)
        .then(res => setUnreadCount(res.unreadCount))
        .catch(() => {});
    }
  }, [activePatient, currentPage]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0F766E] to-[#0D9488] flex items-center justify-center shadow-md shadow-teal-700/20 text-white">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-[#0B1E33]">
                  SAATHI <span className="text-[#0D9488]">CARE</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  MVP
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Elderly Care & Medication Circle
              </p>
            </div>
          </div>

          {/* Center: Patient Profile Selector (if authenticated) */}
          {user && activePatient && (
            <div className="relative">
              <button
                onClick={() => setPatientMenuOpen(!patientMenuOpen)}
                className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-[#0B1E33] font-medium"
              >
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  {activePatient.full_name.charAt(0)}
                </div>
                <span className="font-semibold">{activePatient.full_name}</span>
                <span className="text-xs text-slate-500 hidden md:inline">({activePatient.age}y, {activePatient.gender})</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {patientMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Switch Patient</p>
                  </div>
                  {patients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        selectPatient(p.id);
                        setPatientMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-sm hover:bg-slate-50 transition-colors ${
                        p.id === activePatient.id ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <span>{p.full_name}</span>
                      <span className="text-xs text-slate-400">{p.relationship || 'Member'}</span>
                    </button>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        onNavigate('onboarding');
                        setPatientMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 flex items-center space-x-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add / Join Another Patient</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Elder Mode Toggle */}
            <button
              onClick={toggleElderMode}
              title={isElderMode ? 'Switch to Standard View' : 'Switch to Elder-Friendly High-Contrast Large Text Mode'}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                isElderMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm ring-2 ring-amber-400/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Accessibility className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">{isElderMode ? 'Elder Mode: ON' : 'Elder Mode'}</span>
            </button>

            {/* AI Care Assistant Button */}
            {user && (
              <button
                onClick={onOpenAi}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:from-teal-700 hover:to-emerald-700 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span className="hidden md:inline">AI Care Guide</span>
              </button>
            )}

            {/* Notification Bell */}
            {user && (
              <button
                onClick={() => onNavigate('notifications')}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile / Logout */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-[#0B1E33]">{user.name}</div>
                  <div className="text-[10px] uppercase font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="px-4 py-2 rounded-xl bg-[#0B1E33] text-white text-sm font-semibold hover:bg-slate-800 transition-all"
              >
                Sign In
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
