import React, { Suspense, lazy, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/error';
import {
  ShieldCheck, Users, Pill, Clock, Sparkles,
  ArrowRight, CheckCircle2, ChevronRight, Volume2,
  Heart, AlertTriangle, Calendar, Activity, Lock, Eye
} from 'lucide-react';

const HeroScene = lazy(() => import('../components/three/HeroScene'));

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const { loginAsGuest } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleGuestDemo = async () => {
    setDemoLoading(true);
    try {
      await loginAsGuest();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to start demo'));
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F1] text-slate-800 relative selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      
      {/* Aurora Ambient Background Glow */}
      <div className="aurora-bg absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="noise-overlay absolute inset-0" />
      </div>

      {/* Top Hackathon Ribbon */}
      <div className="relative z-20 bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#FB7185] text-white py-2 px-4 text-center text-xs font-semibold tracking-wide shadow-xs">
        🏆 Built for <strong>PromptWars × Catalyst</strong> — Intelligent Elderly Care & Collaborative Medication Circle
      </div>

      {/* Glass Navigation Header */}
      <nav className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4.5 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={onLogin}>
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
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase hidden sm:block">
              AI-Powered Eldercare
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleGuestDemo}
            disabled={demoLoading}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold text-xs shadow-xs cursor-pointer transition-all disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{demoLoading ? "Loading…" : "Try Demo"}</span>
          </button>
          <button
            onClick={onLogin}
            className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-teal-700 transition-colors cursor-pointer"
          >
            Sign In with PIN
          </button>
          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 rounded-2xl signature-btn text-white font-bold text-sm shadow-md cursor-pointer flex items-center space-x-1.5"
          >
            <span>Start Care Circle</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative z-10 pt-8 pb-16 lg:pt-14 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass border border-teal-200/80 text-teal-900 text-xs font-bold tracking-wide shadow-xs">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping inline-block" />
                <span>ELDER-CENTERED COLLABORATIVE HEALTHCARE</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1F2937] tracking-tight leading-[1.12]">
                Care that feels like <br />
                <span className="gradient-text-warm font-serif italic font-normal">family.</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                SAATHI CARE connects seniors, family members, and caregivers into a unified Care Circle. Seniors manage medications independently with simple 4-digit PINs, while authorized families stay peacefully informed with 3-tier safety escalations.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 flex-wrap">
                <button
                  onClick={handleGuestDemo}
                  disabled={demoLoading}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-base shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  <Sparkles className="w-5 h-5 text-amber-100" />
                  <span>{demoLoading ? "Preparing Ramesh's care profile…" : "✨ Try Live Demo — no signup"}</span>
                </button>
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl signature-btn text-white font-bold text-base shadow-lg flex items-center justify-center space-x-2 cursor-pointer group"
                >
                  <span>Start your Care Circle</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={onLogin}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl glass hover:bg-white text-slate-800 font-bold text-sm border border-slate-200/80 shadow-xs cursor-pointer transition-all"
                >
                  Sign in with PIN
                </button>
              </div>

              {/* Trust badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-semibold text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>4-Digit PIN Elder Login</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Smart 3-Tier Escalation</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Never Double Missed Dose</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Interactive 3D Canvas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative flex items-center justify-center"
            >
              <div className="w-full relative">
                <Suspense
                  fallback={
                    <div className="w-full h-[460px] flex items-center justify-center">
                      <div className="w-36 h-36 rounded-full signature-gradient opacity-60 blur-xl animate-pulse" />
                    </div>
                  }
                >
                  <HeroScene />
                </Suspense>

                {/* Floating pill badge on top of 3D canvas */}
                <div className="absolute -bottom-4 left-6 right-6 glass p-4 rounded-2xl border border-white/80 shadow-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                      <Pill className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Metformin 500mg</div>
                      <div className="text-[11px] text-slate-500">Morning Dose • Confirmed Taken</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    ✓ Adherence 100%
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ===================== ANIMATED STATS STRIP ===================== */}
      <section className="relative z-10 py-8 bg-white/60 backdrop-blur-md border-y border-amber-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-1"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0F766E] font-serif">3-Tier</div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">Smart Escalation System</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-1"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-[#FB7185] font-serif">4-Digit</div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">Passcode Easy Access</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-1"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-600 font-serif">24 / 7</div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">Adherence & Refill Guard</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-1"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-serif">0%</div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">Duplicate Medication Logs</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="relative z-10 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Simple 3-Step Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-serif">
              How Saathi Care protects your family
            </h2>
            <p className="text-base text-slate-600">
              Designed around elder independence, not micro-management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 text-center space-y-4 relative"
            >
              <div className="w-14 h-14 rounded-2xl signature-gradient text-white flex items-center justify-center font-extrabold text-xl mx-auto shadow-md">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-serif">Create Care Circle</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Senior sets up a profile with a 4-digit PIN, generating a secure <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-xs font-bold">SAATHI-XXXX</code> code for trusted family members to join.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="glass-card p-8 text-center space-y-4 relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#14B8A6] to-[#0F766E] text-white flex items-center justify-center font-extrabold text-xl mx-auto shadow-md">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-serif">Manage Prescriptions</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Add medicine name, dosage, schedule slots, and inventory counts. Seniors enjoy giant high-contrast buttons and text-to-speech read aloud.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="glass-card p-8 text-center space-y-4 relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FB7185] to-[#FDBA74] text-white flex items-center justify-center font-extrabold text-xl mx-auto shadow-md">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-serif">Autonomous Escalation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                If a dose remains unconfirmed, our 3-tier engine gently reminds, issues follow-ups, and notifies authorized family without ever recommending dangerous double doses.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURE BENTO GRID ===================== */}
      <section className="relative z-10 py-20 bg-white/50 backdrop-blur-sm border-t border-amber-200/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FB7185] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Purpose-Built Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-serif">
              Built for Seniors. Trusted by Doctors. Loved by Families.
            </h2>
            <p className="text-base text-slate-600">
              Every detail engineered to prevent medication errors and caregiver burnout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento 1: Elder Mode */}
            <div className="md:col-span-2 glass-card p-8 glass-card-hover space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-serif">
                Elder-Friendly Mode + Web Speech Read Aloud
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                Massive readable fonts, high-contrast buttons, single-card focus, and native speech synthesis that speaks instructions aloud in crystal-clear audio with a single tap.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">80px+ Large Touch Targets</span>
                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">Zero Distracting Motion</span>
                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">Speech Synthesis</span>
              </div>
            </div>

            {/* Bento 2: 3-Tier Escalation */}
            <div className="glass-card p-8 glass-card-hover space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-serif">
                3-Tier Smart Escalation Guard
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tier 1 gentle notice, Tier 2 urgent reminder, Tier 3 caregiver email escalation. Never double missed doses.
              </p>
            </div>

            {/* Bento 3: Care Circle */}
            <div className="glass-card p-8 glass-card-hover space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-serif">
                Care Circle Collaboration
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect children, physicians, and nurses to a single patient profile with granular role-based edit permissions.
              </p>
            </div>

            {/* Bento 4: Appointment Guardian */}
            <div className="glass-card p-8 glass-card-hover space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-serif">
                Appointment Guardian
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Countdown timers for doctor visits, hospital directions, and automated 24-hour reminder email dispatch.
              </p>
            </div>

            {/* Bento 5: Clinical AI Explainer */}
            <div className="glass-card p-8 glass-card-hover space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-serif">
                Clinical AI Explainer
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Explains complex medication instructions in plain language. Strictly refuses diagnostic claims or dose changes.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ===================== A DAY WITH SAATHI (Phone Mockup) ===================== */}
      <section className="relative z-10 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Mockup description */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Experience Elder View
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-serif">
                A single tap to confirm. <br />
                Peace of mind for everyone.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                When morning arrives, elders don't navigate complex SaaS tables or confusing menus. They see exactly what medicine to take right now, with big readable typography, meal instructions, and an 80px emerald button.
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700"><strong>Instant Audio Feedback:</strong> Confirms dose taken verbally so elders never question if they completed it.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700"><strong>Pill Count Tracking:</strong> Automatically decrements remaining pills and flags low stock to caregivers.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700"><strong>Emergency Hotline:</strong> One-touch direct dial to emergency contact Neha Sharma.</p>
                </div>
              </div>
            </div>

            {/* Right Phone Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-[340px] sm:w-[380px] bg-white rounded-[44px] p-4 shadow-2xl border-4 border-slate-800 relative">
                {/* Speaker pill notch */}
                <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-4" />

                {/* Elder Mode Screen Content inside phone */}
                <div className="bg-[#FFFBEB] rounded-[32px] p-5 space-y-4 border border-amber-200/80">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span>MORNING DOSE</span>
                    <span>08:00 AM</span>
                  </div>

                  <div className="text-center py-2 space-y-1">
                    <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold mx-auto shadow-md">
                      <Pill className="w-9 h-9" />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 pt-1">Metformin</h4>
                    <p className="text-base font-bold text-teal-800">500 mg Tablet</p>
                    <p className="text-xs text-slate-600 font-medium pt-1">Take with food & full glass of water</p>
                  </div>

                  {/* Big Confirmation Button */}
                  <button
                    onClick={onGetStarted}
                    className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg shadow-lg flex items-center justify-center space-x-2 cursor-pointer hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span>YES, I TOOK THIS PILL</span>
                  </button>

                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-500">
                      🔊 Listen Instructions Aloud
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================== TRUST & CLINICAL SAFETY ===================== */}
      <section className="relative z-10 py-16 bg-[#0F766E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-2">
              <h4 className="text-lg font-bold font-serif text-teal-200">🛡️ Never Double Missed Dose</h4>
              <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
                If a dose is missed beyond the clinical safety window, our protocol explicitly advises skipping it rather than taking a double dose.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold font-serif text-teal-200">🔒 Zero Plaintext Passcodes</h4>
              <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
                All 4-digit PINs and passwords are cryptographic bcrypt hashes. Session authentication enforces granular patient access permissions.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold font-serif text-teal-200">🩺 Physician Decision Support</h4>
              <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
                SAATHI CARE provides adherence tracking and instruction clarification. It never replaces your licensed medical doctor or alters prescriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA BAND ===================== */}
      <section className="relative z-10 py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-serif">
            Ready to bring peace of mind to your family?
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Set up an elder profile in less than 2 minutes. No credit card required.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
            <button
              onClick={handleGuestDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-base shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all disabled:opacity-60"
            >
              <Sparkles className="w-5 h-5 text-amber-100" />
              <span>{demoLoading ? "Preparing Ramesh's care profile…" : "✨ Try Live Demo — no signup"}</span>
            </button>
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl signature-btn text-white font-bold text-base shadow-xl flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl glass hover:bg-white text-slate-800 font-bold text-base border border-slate-200/80 shadow-xs cursor-pointer"
            >
              Sign In with PIN
            </button>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="relative z-10 py-8 border-t border-amber-200/50 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <img src="/logo-icon.png" alt="" className="w-5 h-5 object-contain" />
            <span className="font-bold text-slate-800">SAATHI CARE</span>
            <span>— PromptWars × Catalyst MVP</span>
          </div>
          <div>
            Built with React 19, Tailwind v4, Three.js & Node.js • Live on Render
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
