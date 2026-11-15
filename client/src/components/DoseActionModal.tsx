import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MedicationLog } from '../types';
import { Check, X, ShieldAlert, Pill, Clock } from 'lucide-react';

interface DoseActionModalProps {
  item: MedicationLog | null;
  onClose: () => void;
  onConfirm: (status: 'taken' | 'skipped', reason?: string, notes?: string) => Promise<void>;
}

export const DoseActionModal: React.FC<DoseActionModalProps> = ({ item, onClose, onConfirm }) => {
  const [mode, setMode] = useState<'taken' | 'skipped'>('taken');
  const [skippedReason, setSkippedReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(mode, skippedReason, notes);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update dose');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="glass-card max-w-md w-full p-6 sm:p-7 shadow-2xl relative bg-white/95"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Drug Info */}
        <div className="flex items-center space-x-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl signature-gradient text-white flex items-center justify-center font-bold shadow-xs">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight font-serif">{item.medication_name}</h3>
            <p className="text-xs text-slate-500 font-medium">
              {item.dosage} • {item.form || 'Tablet'} • {item.scheduled_slot.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Instructions Banner */}
        {item.instructions && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 mb-5 text-xs text-slate-700 flex items-start space-x-2">
            <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Doctor's Instructions:</span> {item.instructions}
              {item.meal_timing && (
                <div className="text-teal-800 font-bold mt-0.5">
                  Timing: {item.meal_timing.replace('_', ' ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Selection Switch */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-amber-50/80 rounded-2xl mb-5 border border-amber-200/60">
          <button
            type="button"
            onClick={() => setMode('taken')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              mode === 'taken'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Mark as Taken</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('skipped')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              mode === 'skipped'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
            <span>Skip Dose</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'skipped' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reason for skipping (recommended)
              </label>
              <select
                value={skippedReason}
                onChange={e => setSkippedReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select a reason...</option>
                <option value="Felt nauseous or unwell">Felt nauseous or unwell</option>
                <option value="Doctor advised to pause">Doctor advised to pause</option>
                <option value="Fasting for lab test">Fasting for lab test</option>
                <option value="Medicine ran out">Medicine ran out of stock</option>
                <option value="Forgot until next dose">Forgot until next dose was due</option>
                <option value="Other">Other</option>
              </select>

              <div className="mt-3 p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-xs text-amber-950 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Protocol:</strong> Do not double up on your next dose. Your care circle will be kept informed.
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Optional Note (e.g. "Taken with warm water after breakfast")
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any note..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                mode === 'taken'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
              }`}
            >
              {submitting ? 'Recording...' : mode === 'taken' ? 'Confirm Dose Taken' : 'Confirm Dose Skipped'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DoseActionModal;
