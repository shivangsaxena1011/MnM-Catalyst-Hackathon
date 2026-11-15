import React, { useState } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Trash2, CheckCircle2 } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { user, refreshPatients, activePatient, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  if (!user) return null;

  // Requirement 7: Guest Demo user slim banner
  if (user.email?.endsWith('@demo.saathi.care')) {
    return (
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white px-4 py-1.5 shadow-xs border-b border-amber-300/30 relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 text-white font-black px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-xs">
              GUEST DEMO
            </span>
            <span className="text-white font-medium">
              You're viewing a demo account — data resets periodically.
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="text-white hover:text-amber-100 font-bold underline underline-offset-2 flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <span>Create your own Care Circle</span>
            <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await api.demo.seed();
      await refreshPatients();
      setBannerMsg(res.message);
      setTimeout(() => setBannerMsg(null), 5000);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to seed demo data'));
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
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to reset demo data'));
    } finally {
      setLoading(false);
    }
  };

  const isDemoActive = Boolean(activePatient?.invite_code?.startsWith('SAATHI-DEMO') || activePatient?.full_name === 'Ramesh Sharma');

  return (
    <div className="bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#FB7185] text-white px-4 py-2 shadow-xs border-b border-amber-200/40 relative z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center space-x-2">
          <span className="bg-white/20 text-white font-black px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-xs">
            HACKATHON EVALUATION
          </span>
          <span className="text-white/95 font-medium">
            {isDemoActive ? (
              <span className="text-amber-100 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Demo Profile Active: Ramesh Sharma (72y, Hypertension & Type 2 Diabetes)
              </span>
            ) : (
              <span>You are viewing live data. Load judge preview data to explore 7-day adherence & live escalations.</span>
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {bannerMsg && (
            <span className="text-amber-200 font-bold animate-pulse hidden md:inline">
              {bannerMsg}
            </span>
          )}

          {!isDemoActive ? (
            <button
              onClick={handleSeed}
              disabled={loading}
              className="bg-white text-teal-950 font-bold px-3.5 py-1 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm hover:bg-amber-50 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{loading ? 'Loading...' : 'Load Judge Demo Profile'}</span>
            </button>
          ) : (
            <button
              onClick={handleReset}
              disabled={loading}
              className="bg-rose-950/40 hover:bg-rose-900 text-white border border-white/30 font-bold px-2.5 py-1 rounded-xl text-xs flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
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
