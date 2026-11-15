import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Trash2, CheckCircle2 } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { user, refreshPatients, activePatient } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await api.demo.seed();
      await refreshPatients();
      setBannerMsg(res.message);
      setTimeout(() => setBannerMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to seed demo data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset demo profile data? This will clear the judge preview profile.')) return;
    setLoading(true);
    try {
      const res = await api.demo.reset();
      await refreshPatients();
      setBannerMsg(res.message);
      setTimeout(() => setBannerMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo data');
    } finally {
      setLoading(false);
    }
  };

  const isDemoActive = activePatient?.invite_code === 'SAATHI-DEMO' || activePatient?.full_name === 'Ramesh Sharma';

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#0B1E33] to-[#0F2942] text-white px-4 py-2.5 shadow-sm border-b border-teal-500/30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center space-x-2">
          <span className="bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded text-[11px] border border-teal-400/30">
            HACKATHON EVALUATION
          </span>
          <span className="text-slate-300 font-medium">
            {isDemoActive ? (
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Demo Profile Active: Ramesh Sharma (72y, Hypertension & Type 2 Diabetes)
              </span>
            ) : (
              <span>You are viewing live data. Load judge preview data to explore 7-day adherence & live escalations.</span>
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {bannerMsg && (
            <span className="text-emerald-400 font-medium animate-pulse hidden md:inline">
              {bannerMsg}
            </span>
          )}

          {!isDemoActive ? (
            <button
              onClick={handleSeed}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-3 py-1 rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span>{loading ? 'Loading...' : 'Load Judge Demo Profile'}</span>
            </button>
          ) : (
            <button
              onClick={handleReset}
              disabled={loading}
              className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 font-semibold px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
