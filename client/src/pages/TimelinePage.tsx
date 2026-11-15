import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ActivityItem } from '../types';
import {
  Activity, CheckCircle2, AlertTriangle, Calendar,
  Users, UserPlus, Clock
} from 'lucide-react';

export const TimelinePage: React.FC = () => {
  const { activePatient } = useAuth();
  const [events, setEvents] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const loadTimeline = useCallback(async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const res = await api.timeline.list(activePatient.id, filterType === 'all' ? undefined : filterType);
      setEvents(res.events || []);
    } catch (err) {
      console.error('[Timeline Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [activePatient, filterType]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const getEventIcon = (actionType: string) => {
    if (actionType.includes('taken')) return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (actionType.includes('escalation')) return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    if (actionType.includes('appointment')) return <Calendar className="w-4 h-4 text-teal-600" />;
    if (actionType.includes('member')) return <Users className="w-4 h-4 text-indigo-600" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1E33]">Health Care Timeline</h1>
          <p className="text-xs text-slate-500 font-medium">
            Chronological audit of doses taken, escalations, consultations, and caregiver actions
          </p>
        </div>

        {/* Filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none"
        >
          <option value="all">All Events</option>
          <option value="medication_taken">Doses Taken</option>
          <option value="escalation_triggered">Escalations</option>
          <option value="appointment_scheduled">Appointments</option>
          <option value="member_joined">Care Circle Updates</option>
        </select>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading timeline events...</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Events Logged</h3>
          <p className="text-xs text-slate-400 mt-1">Actions taken by the patient or care circle will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {events.map(ev => (
              <div key={ev.id} className="relative group">
                {/* Bullet */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-teal-500 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-teal-500" />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center space-x-2">
                      {getEventIcon(ev.action_type)}
                      <span className="text-xs font-bold text-slate-900">{ev.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(ev.created_at).toLocaleString()}
                    </span>
                  </div>

                  {ev.details && (
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      {ev.details}
                    </p>
                  )}

                  {ev.user_name && (
                    <div className="mt-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Logged by: {ev.user_name} ({ev.user_role || 'Care Member'})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
