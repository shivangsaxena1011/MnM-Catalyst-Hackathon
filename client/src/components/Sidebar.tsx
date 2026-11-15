import React from 'react';
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
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col min-h-[calc(100vh-4.5rem)] p-4 shrink-0">
      <div className="space-y-1.5 flex-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                isActive
                  ? 'bg-[#0B1E33] text-white shadow-sm font-semibold'
                  : item.highlight
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/60 hover:bg-amber-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : item.highlight ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Safety Reminder Card in Sidebar */}
      <div className="mt-6 p-3.5 rounded-2xl bg-teal-50 border border-teal-200/70 text-xs text-teal-950">
        <p className="font-bold mb-1 flex items-center space-x-1.5">
          <span>🛡️</span>
          <span>Care Circle Protocol</span>
        </p>
        <p className="text-teal-800 leading-relaxed">
          Never double a missed dose. If overdue, follow doctor guidelines and record updates.
        </p>
      </div>
    </aside>
  );
};
