import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Medication, MealTiming } from '../types';
import { X, Pill } from 'lucide-react';
import { getErrorMessage } from '../utils/error';
import { useFeedback } from './ui/FeedbackProvider';

interface AddMedicationModalProps {
  initialMed?: Medication | null;
  onClose: () => void;
  onSave: (payload: Partial<Medication>) => Promise<void>;
}

const AVAILABLE_SLOTS = [
  { id: 'morning', label: 'Morning (08:00 AM)' },
  { id: 'afternoon', label: 'Afternoon (01:00 PM)' },
  { id: 'evening', label: 'Evening (06:00 PM)' },
  { id: 'night', label: 'Night (09:00 PM)' },
];

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({ initialMed, onClose, onSave }) => {
  const { notify } = useFeedback();
  const [name, setName] = useState(initialMed?.name || '');
  const [genericName, setGenericName] = useState(initialMed?.generic_name || '');
  const [dosage, setDosage] = useState(initialMed?.dosage || '');
  const [form, setForm] = useState(initialMed?.form || 'Tablet');
  const [instructions, setInstructions] = useState(initialMed?.instructions || '');
  const [mealTiming, setMealTiming] = useState<MealTiming>(initialMed?.meal_timing || 'after_food');
  const [frequency, setFrequency] = useState(initialMed?.frequency || 'daily');
  const [slots, setSlots] = useState<string[]>(initialMed?.schedule_slots || ['morning']);
  const [inventoryCount, setInventoryCount] = useState<number>(initialMed?.inventory_count ?? 30);
  const [refillThreshold, setRefillThreshold] = useState<number>(initialMed?.refill_alert_threshold ?? 5);
  const [prescribedBy, setPrescribedBy] = useState(initialMed?.prescribed_by || '');
  const [submitting, setSubmitting] = useState(false);

  const prevFocusedElem = useRef<HTMLElement | null>(null);

  useEffect(() => {
    prevFocusedElem.current = document.activeElement as HTMLElement | null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      prevFocusedElem.current?.focus?.();
    };
  }, [onClose]);

  const toggleSlot = (slotId: string) => {
    if (slots.includes(slotId)) {
      if (slots.length > 1) {
        setSlots(slots.filter(s => s !== slotId));
      }
    } else {
      setSlots([...slots, slotId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) {
      notify('Please provide medication name and dosage', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        generic_name: genericName.trim() || null,
        dosage: dosage.trim(),
        form,
        instructions: instructions.trim() || null,
        meal_timing: mealTiming,
        frequency,
        schedule_slots: slots,
        inventory_count: Number(inventoryCount),
        refill_alert_threshold: Number(refillThreshold),
        prescribed_by: prescribedBy.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Failed to save medication'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="med-modal-title"
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="glass-card max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8 bg-white/95"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close medication modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h3 id="med-modal-title" className="text-xl font-bold text-[#0B1E33]">
              {initialMed ? 'Edit Medication' : 'Add New Prescription'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure medication schedule and doctor instructions for the care circle
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="med-name" className="block text-xs font-bold text-slate-700 mb-1">Medication Name *</label>
              <input
                id="med-name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Metformin, Amlodipine"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="med-generic-name" className="block text-xs font-bold text-slate-700 mb-1">Generic / Brand Name</label>
              <input
                id="med-generic-name"
                type="text"
                value={genericName}
                onChange={e => setGenericName(e.target.value)}
                placeholder="e.g. Glucophage, Norvasc"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="med-dosage" className="block text-xs font-bold text-slate-700 mb-1">Dosage *</label>
              <input
                id="med-dosage"
                type="text"
                required
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                placeholder="e.g. 500 mg, 1 tab"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="med-form" className="block text-xs font-bold text-slate-700 mb-1">Form</label>
              <select
                id="med-form"
                value={form}
                onChange={e => setForm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup (Liquid)</option>
                <option value="Injection">Injection</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Drops">Eye/Ear Drops</option>
              </select>
            </div>

            <div>
              <label htmlFor="med-meal-timing" className="block text-xs font-bold text-slate-700 mb-1">Meal Timing</label>
              <select
                id="med-meal-timing"
                value={mealTiming}
                onChange={e => setMealTiming(e.target.value as MealTiming)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              >
                <option value="after_food">After Food</option>
                <option value="before_food">Before Food</option>
                <option value="with_food">With Food</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>
          </div>

          {/* Schedule Slots */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Daily Schedule Slots (Select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Medication schedule slot choices">
              {AVAILABLE_SLOTS.map(slot => {
                const isSelected = slots.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleSlot(slot.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{slot.label}</span>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-teal-600 text-white font-bold' : 'border border-slate-300'}`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="med-instructions" className="block text-xs font-bold text-slate-700 mb-1">Doctor's Instructions</label>
            <textarea
              id="med-instructions"
              rows={2}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Swallow whole with a full glass of water. Do not chew."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="med-inventory-count" className="block text-xs font-bold text-slate-700 mb-1">Current Pill Stock</label>
              <input
                id="med-inventory-count"
                type="number"
                min="0"
                value={inventoryCount}
                onChange={e => setInventoryCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="med-refill-threshold" className="block text-xs font-bold text-slate-700 mb-1">Refill Alert At</label>
              <input
                id="med-refill-threshold"
                type="number"
                min="1"
                value={refillThreshold}
                onChange={e => setRefillThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="med-prescribed-by" className="block text-xs font-bold text-slate-700 mb-1">Prescribed By Doctor</label>
              <input
                id="med-prescribed-by"
                type="text"
                value={prescribedBy}
                onChange={e => setPrescribedBy(e.target.value)}
                placeholder="e.g. Dr. Rajesh Varma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold signature-btn text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : initialMed ? 'Save Changes' : 'Add Medication'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
