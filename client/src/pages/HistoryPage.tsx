import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { MedicationLog, AdherenceStats } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';

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
      // 30 days range
      const endD = new Date().toISOString().split('T')[0];
      const startD = new Date();
      startD.setDate(startD.getDate() - 30);
      const startDStr = startD.toISOString().split('T')[0];

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
        <h1 className="text-2xl font-extrabold text-[#0B1E33]">Adherence History & Analytics</h1>
        <p className="text-xs text-slate-500 font-medium">
          Verifiable medication adherence timeline and dosage confirmation trends
        </p>
      </div>

      {/* Metrics & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recharts 7-Day Adherence Visualizer */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">7-Day Adherence Trend</h2>
              <p className="text-xs text-slate-400">Daily percentage of confirmed taken doses</p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl">
              Overall: {stats?.overallAdherenceRate || 100}%
            </span>
          </div>

          <div className="h-64 w-full">
            {stats && stats.trendData && stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1E33',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val}% Adherence`, 'Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#0D9488"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#rateGradient)"
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
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Adherence by Time of Day</h2>
          <p className="text-xs text-slate-400">Total doses confirmed across daily time slots</p>

          <div className="space-y-3 pt-2">
            {[
              { slot: 'Morning', count: stats?.slotStats?.morning || 0, color: 'bg-amber-500' },
              { slot: 'Afternoon', count: stats?.slotStats?.afternoon || 0, color: 'bg-teal-500' },
              { slot: 'Evening', count: stats?.slotStats?.evening || 0, color: 'bg-indigo-500' },
              { slot: 'Night', count: stats?.slotStats?.night || 0, color: 'bg-slate-700' },
            ].map((s, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${s.color}`} />
                  <span className="font-semibold text-slate-700">{s.slot}</span>
                </div>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {s.count} doses
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            💡 <strong>Observation:</strong> Morning and night routines show highest compliance when paired with regular meal times.
          </div>
        </div>

      </div>

      {/* Adherence Logs Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Recorded Doses Audit Trail</h2>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['all', 'taken', 'missed', 'skipped'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  filterStatus === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs italic">
            No medication log entries match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Slot</th>
                  <th className="pb-3 px-3">Medication</th>
                  <th className="pb-3 px-3">Dosage</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Confirmed At / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const isTaken = log.status === 'taken';
                  const isMissed = log.status === 'missed';
                  const isSkipped = log.status === 'skipped';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800">{log.scheduled_date}</td>
                      <td className="py-3 px-3 uppercase font-bold text-teal-800">{log.scheduled_slot}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{log.medication_name}</td>
                      <td className="py-3 px-3 text-slate-600">{log.dosage}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            isTaken
                              ? 'bg-emerald-100 text-emerald-800'
                              : isMissed
                              ? 'bg-rose-100 text-rose-800'
                              : isSkipped
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isTaken && <CheckCircle2 className="w-3 h-3 mr-0.5" />}
                          {isMissed && <XCircle className="w-3 h-3 mr-0.5" />}
                          {isSkipped && <AlertCircle className="w-3 h-3 mr-0.5" />}
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {isTaken && log.taken_at ? (
                          <span>{new Date(log.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : isSkipped ? (
                          <span className="text-amber-800 italic">{log.skipped_reason || 'Skipped'}</span>
                        ) : isMissed ? (
                          <span className="text-rose-700 font-medium">Unconfirmed overdue dose</span>
                        ) : (
                          'Scheduled'
                        )}
                        {log.notes && <span className="ml-2 text-slate-400">({log.notes})</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
