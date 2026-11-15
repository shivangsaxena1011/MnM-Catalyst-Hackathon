import React from 'react';
import {
  HeartHandshake, ShieldCheck, Users, Pill,
  Clock, Sparkles, ArrowRight, CheckCircle2, ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Top Banner */}
      <div className="bg-[#0B1E33] text-white py-2 px-4 text-center text-xs font-medium border-b border-teal-500/20">
        🏆 Built for <strong>PromptWars × Catalyst</strong> — Intelligent Elderly Care & Medication Management
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>COLLABORATIVE HEALTHCARE PLATFORM</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0B1E33] tracking-tight leading-[1.15]">
                Independent care for elders. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600">
                  Peace of mind
                </span> for the whole family.
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                <strong>SAATHI CARE</strong> connects seniors, family members, and caregivers into a unified Care Circle. Features smart multi-tier escalation, appointment guardian, elder-friendly large text mode, and verified AI guidance.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-base shadow-xl shadow-teal-700/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <span>Start Care Circle</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={onLogin}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-base shadow-sm transition-all cursor-pointer"
                >
                  Sign In with Passcode
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Passcode Protected</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Smart Escalations</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Never Double Missed Dose</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 space-y-5 relative">
                
                {/* Live Pill Status Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Ramesh Sharma (72y)</h4>
                      <p className="text-xs text-slate-500">Care Circle: Daughter + Nurse</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    88% Adherence
                  </span>
                </div>

                {/* Dose Card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Morning Dose</span>
                    <span className="text-xs text-slate-500 font-medium">08:00 AM</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Metformin 500mg</div>
                      <div className="text-xs text-slate-500">Take with food & water</div>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmed by Senior at 08:35 AM
                    </span>
                  </div>
                </div>

                {/* Escalation Example */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Smart Escalation Alert</span>
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Tier 3</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Amlodipine 5mg unconfirmed &gt;90m. Daughter Priya and Nurse Anitha notified via dashboard & email.
                  </p>
                  <p className="text-[11px] text-amber-900/80 italic font-medium">
                    Protocol: Do not double dose. Continue next scheduled time.
                  </p>
                </div>

                {/* Appointment Guardian snippet */}
                <div className="bg-teal-50/60 rounded-2xl p-3.5 border border-teal-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-4 h-4 text-teal-700" />
                    <div>
                      <div className="font-bold text-teal-950">Dr. Rajesh Varma (Cardiologist)</div>
                      <div className="text-teal-800">Routine Checkup • In 4 days</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-teal-600" />
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-[#0B1E33] tracking-tight">
              A Complete Elderly Healthcare Ecosystem
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Engineered with human-centered empathy, clinical safety constraints, and family collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Pillar 1 */}
            <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200/80 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Care Circle Network</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect the senior with children, siblings, and visiting nurses via simple invite codes and role-based permissions.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200/80 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Smart Care Escalation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Detects unconfirmed doses through gentle senior reminders up to real-time caregiver alerts. Strictly prevents double dosing.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200/80 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Elder-Friendly Mode</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Extra-large typography, high contrast, oversized buttons, and text-to-speech audio narration for independence.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200/80 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Care Assistant</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Compassionate plain-language explanations of prescriptions with strict safety boundaries and clinical rule fallbacks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#0B1E33] text-slate-400 text-center text-xs border-t border-slate-800">
        <p>SAATHI CARE • PromptWars × Catalyst Hackathon MVP • Designed for Senior Health & Family Peace of Mind</p>
      </footer>
    </div>
  );
};
