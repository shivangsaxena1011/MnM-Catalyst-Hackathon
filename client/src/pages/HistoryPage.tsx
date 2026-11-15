import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { MedicationLog, AdherenceStats } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { CheckCircle2, XCircle, AlertCircle, Calendar, Pill } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { activePatient } = useAuth();
  const [stats, setStats] = useState<AdherenceStats | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadHistoryData = useCallback(async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.logs.getAdherenceStats(activePatient.id),
        api.logs.getScheduleAndLogs(activePatient.id),
      ]);

      setStats(statsRes);
      setLogs(logsRes.logs || []);
    } catch (err) {
      console.error('[Load History Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [activePatient]);

  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);

  const filteredLogs = logs.filter(l => {
    if (filterStatus === 'all') return true;
    return l.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-serif">Adherence History & Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Verifiable medication adherence timeline and dosage confirmation trends for {activePatient?.full_name}
        </p>
      </div>

      {/* Metrics & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recharts 7-Day Adherence Visualizer */}
        <div className="lg:col-span-8 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-serif">7-Day Adherence Trend</h2>
              <p className="text-xs text-slate-400">Daily percentage of confirmed taken doses</p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-3 py-1 rounded-full">
              Overall: {stats?.overallAdherenceRate || 100}%
            </span>
          </div>

          <div className="h-64 w-full">
            {stats && stats.trendData && stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="warmAdherenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#FB7185" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: '#FDBA74',
                      borderRadius: '16px',
                      color: '#1F2937',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(251, 113, 133, 0.2)',
                    }}
                    formatter={(val: any) => [`${val}% Adherence`, 'Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#14B8A6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#warmAdherenceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No history data available yet
              </div>
            )}
          </div>
        </div>

        {/* Slot Breakdown Card */}
        <div className="lg:col-span-4 glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 font-serif">Adherence by Time of Day</h2>
          <p className="text-xs text-slate-400">Total doses confirmed across daily time slots</p>

          <div className="space-y-3 pt-2">
            {[
              { slot: 'Morning', count: stats?.slotStats?.morning || 0, color: 'bg-amber-400' },
              { slot: 'Afternoon', count: stats?.slotStats?.afternoon || 0, color: 'bg-teal-500' },
              { slot: 'Evening', count: stats?.slotStats?.evening || 0, color: 'bg-rose-400' },
              { slot: 'Night', count: stats?.slotStats?.night || 0, color: 'bg-indigo-600' },
            ].map((s, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full ${s.color}`} />
                  <span className="font-bold text-slate-700">{s.slot}</span>
                </div>
                <span className="font-extrabold text-slate-900 bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-200/50">
                  {s.count} doses
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-amber-100 text-xs text-slate-600 leading-relaxed">
            💡 <strong>Observation:</strong> Morning and night routines show highest compliance when paired with regular meal times.
          </div>
        </div>

      </div>

      {/* Adherence Logs List */}
      <div className="glass-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif">Historical Dose Log Record</h2>
            <p className="text-xs text-slate-400">Detailed record of every dose confirmed or skipped</p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-bold">Filter:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-amber-200/80 bg-white text-slate-800 text-xs font-bold cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="taken">Taken Only</option>
              <option value="skipped">Skipped Only</option>
              <option value="missed">Missed Only</option>
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No medication logs found matching this filter.
          </div>
        ) : (
          <div className="divide-y divide-amber-100">
            {filteredLogs.map((log, i) => {
              const isTaken = log.status === 'taken';
              const isSkipped = log.status === 'skipped';

              return (
                <div key={i} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isTaken
                          ? 'bg-emerald-100 text-emerald-700'
                          : isSkipped
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isTaken ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {log.medication_name}{' '}
                        <span className="text-xs text-slate-500 font-normal">({log.dosage})</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <span className="uppercase font-semibold text-teal-700">{log.scheduled_slot}</span>
                        <span>•</span>
                        <span>{log.scheduled_date}</span>
                        {log.skipped_reason && (
                          <span className="text-amber-700 font-medium">({log.skipped_reason})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto ${
                      isTaken
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isSkipped
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default HistoryPage;
