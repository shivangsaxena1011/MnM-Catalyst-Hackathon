import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useElderMode } from '../context/ElderModeContext';
import {
  Bell, Sparkles, LogOut,
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
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-amber-200/50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
            <img
              src="/logo-icon.png"
              alt="SAATHI CARE emblem"
              className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-[#1F2937]">
                  SAATHI <span className="text-[#FB7185]">CARE</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  MVP
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:block">
                AI-Powered Eldercare
              </p>
            </div>
          </div>

          {/* Center: Patient Profile Selector (if authenticated) */}
          {user && activePatient && (
            <div className="relative">
              <button
                onClick={() => setPatientMenuOpen(!patientMenuOpen)}
                className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-2xl border border-amber-200/80 bg-white/90 hover:bg-amber-50/50 transition-all text-sm text-slate-800 font-medium shadow-2xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl signature-gradient text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {activePatient.full_name.charAt(0)}
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-900 block leading-tight">{activePatient.full_name}</span>
                  <span className="text-[10px] text-slate-500 hidden md:block">
                    {activePatient.age}y • {activePatient.blood_group || 'B+'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {patientMenuOpen && (
                <div className="absolute left-0 mt-2 w-68 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-amber-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-amber-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Switch Patient Profile</p>
                  </div>
                  {patients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        selectPatient(p.id);
                        setPatientMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-sm hover:bg-amber-50/60 transition-colors cursor-pointer ${
                        p.id === activePatient.id ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                          {p.full_name.charAt(0)}
                        </div>
                        <span>{p.full_name}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-semibold">{p.relationship || 'Elder'}</span>
                    </button>
                  ))}
                  <div className="border-t border-amber-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        onNavigate('onboarding');
                        setPatientMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 flex items-center space-x-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add / Connect Another Patient</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Friendly Elder Mode Switch */}
            <button
              onClick={toggleElderMode}
              aria-label={isElderMode ? 'Turn off Elder Mode' : 'Turn on Elder Mode'}
              title={isElderMode ? 'Switch to Standard SaaS View' : 'Switch to Elder-Friendly High-Contrast Large Text Mode'}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isElderMode
                  ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs ring-2 ring-amber-400/30'
                  : 'bg-white/80 text-slate-700 border-slate-200/80 hover:bg-white hover:border-amber-300'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full transition-colors ${isElderMode ? 'bg-amber-600' : 'bg-slate-300'}`} />
              <Accessibility className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">{isElderMode ? 'Elder View: ON' : 'Elder View'}</span>
            </button>

            {/* AI Care Assistant Button */}
            {user && (
              <button
                onClick={onOpenAi}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-teal-600 to-[#0F766E] text-white text-xs sm:text-sm font-bold shadow-xs hover:from-teal-700 hover:to-teal-800 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span className="hidden md:inline">AI Care Guide</span>
              </button>
            )}

            {/* Notification Bell with pulse badge */}
            {user && (
              <button
                onClick={() => onNavigate('notifications')}
                className="relative p-2 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-amber-200 transition-all cursor-pointer"
                title="Alerts & Notices"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile / Logout */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-amber-200/60">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div className="text-[10px] uppercase font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full inline-block">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="px-4 py-2 rounded-2xl signature-btn text-white text-sm font-bold shadow-xs cursor-pointer"
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
