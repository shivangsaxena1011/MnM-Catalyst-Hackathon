import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard, Pill, History, Calendar,
  Users, Bell, Activity, Settings, Eye
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isSenior?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'elder', label: 'Elder View', icon: Eye, highlight: true },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'history', label: 'Adherence Log', icon: History },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'care-circle', label: 'Care Circle', icon: Users },
    { id: 'notifications', label: 'Alerts & Notices', icon: Bell },
    { id: 'timeline', label: 'Health Timeline', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Glass Sidebar */}
      <aside className="w-64 bg-white/75 backdrop-blur-md border-r border-amber-200/40 hidden md:flex flex-col min-h-[calc(100vh-4.5rem)] p-4 shrink-0 relative z-30">
        <div className="space-y-1.5 flex-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-label={item.label}
                className={`w-full relative flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl font-medium text-sm transition-all text-left cursor-pointer ${
                  isActive
                    ? 'text-teal-950 font-bold'
                    : item.highlight
                    ? 'text-amber-900 font-semibold hover:bg-amber-50/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {/* Motion Sliding Pill Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-50 to-amber-50/80 border border-teal-200/80 shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}

                <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive
                    ? 'text-teal-600'
                    : item.highlight
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`} />
                <span className="truncate">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase">
                    Large
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Clinical Safety Protocol card */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-teal-50/80 to-amber-50/60 border border-teal-200/70 text-xs text-teal-950 shadow-xs">
          <p className="font-bold mb-1 flex items-center space-x-1.5 text-teal-900">
            <span>🛡️</span>
            <span>Care Circle Protocol</span>
          </p>
          <p className="text-teal-800 leading-relaxed font-normal">
            Never double a missed dose. If overdue, follow physician advice and log accurate status.
          </p>
        </div>

        {/* Developer Attribution */}
        <div className="mt-4 px-2 py-1 text-[11px] text-slate-400 text-center">
          Developed by <span className="font-semibold text-slate-700">Shivang Saxena</span>
        </div>
      </aside>

      {/* Mobile Floating Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-label={item.label}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
