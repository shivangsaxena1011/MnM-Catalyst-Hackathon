import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Medication } from '../types';
import { AddMedicationModal } from '../components/AddMedicationModal';
import { getErrorMessage } from '../utils/error';
import {
  Pill, Plus, Edit2, Trash2, AlertCircle, Clock, PackageCheck
} from 'lucide-react';

export const MedicationsPage: React.FC = () => {
  const { activePatient } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  const loadMedications = useCallback(async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const res = await api.medications.list(activePatient.id);
      setMedications(res.medications || []);
    } catch (err) {
      console.error('[Load Medications Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [activePatient]);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const handleSaveMedication = async (payload: Partial<Medication>) => {
    if (!activePatient) return;
    if (editingMed) {
      await api.medications.update(activePatient.id, editingMed.id, payload);
    } else {
      await api.medications.create(activePatient.id, payload);
    }
    await loadMedications();
  };

  const handleDeleteMedication = async (medId: number, medName: string) => {
    if (!activePatient) return;
    if (!window.confirm(`Discontinue ${medName}? This will remove it from daily schedules.`)) return;
    try {
      await api.medications.delete(activePatient.id, medId);
      await loadMedications();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to delete medication'));
    }
  };

  const getSlotChip = (slot: string) => {
    const s = slot.toLowerCase();
    let icon = '⏰';
    let label = slot;
    if (s.includes('morn')) { icon = '🌅'; label = 'Morning'; }
    else if (s.includes('after')) { icon = '☀️'; label = 'Afternoon'; }
    else if (s.includes('even')) { icon = '🌇'; label = 'Evening'; }
    else if (s.includes('night')) { icon = '🌙'; label = 'Night'; }

    return (
      <span key={slot} className="inline-flex items-center space-x-1 text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200/60">
        <span>{icon}</span>
        <span>{label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-serif">Medication Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Active prescriptions, dosages, schedule timings, and refill tracking for {activePatient?.full_name}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMed(null);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl signature-btn text-white font-bold text-sm shadow-md flex items-center space-x-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Medication List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading prescriptions...</div>
      ) : medications.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-lg mx-auto space-y-4">
          <Pill className="w-14 h-14 text-slate-300 mx-auto" />
          <h3 className="text-xl font-bold text-slate-800 font-serif">No Prescriptions Added Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Keep your loved one’s care circle coordinated by adding their daily medicines, dosages, and meal instructions.
          </p>
          <button
            onClick={() => {
              setEditingMed(null);
              setModalOpen(true);
            }}
            className="px-6 py-3 rounded-2xl signature-btn text-white font-bold text-sm shadow-md cursor-pointer"
          >
            + Add First Medication
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map(med => {
            const isLowStock = med.inventory_count <= med.refill_alert_threshold;
            const stockPct = Math.min(100, Math.max(0, (med.inventory_count / Math.max(30, med.inventory_count)) * 100));

            return (
              <div
                key={med.id}
                className="glass-card p-6 glass-card-hover flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {med.schedule_slots.map(slot => getSlotChip(slot))}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMed(med);
                          setModalOpen(true);
                        }}
                        aria-label={`Edit ${med.name}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        title="Edit Prescription"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedication(med.id, med.name)}
                        aria-label={`Discontinue ${med.name}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Discontinue Medication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Pill Icon */}
                  <div className="flex items-start space-x-3 my-2">
                    <div className="w-10 h-10 rounded-xl signature-gradient text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug font-serif">{med.name}</h3>
                      {med.generic_name && (
                        <p className="text-xs text-slate-400 font-medium italic">
                          {med.generic_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dosage & Form Badge */}
                  <div className="inline-block bg-amber-50 text-amber-900 border border-amber-200/70 text-xs font-bold px-3 py-1 rounded-xl my-2">
                    {med.dosage} • {med.form}
                  </div>

                  {/* Instructions */}
                  {med.instructions && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      <strong>Instructions:</strong> {med.instructions}
                    </p>
                  )}

                  {/* Meal timing */}
                  <div className="flex items-center space-x-1.5 text-xs text-teal-800 font-semibold mt-2.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Take {med.meal_timing.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Footer with Pill Stock Bar */}
                <div className="pt-4 mt-4 border-t border-amber-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Pills Remaining:</span>{' '}
                      <span className={`font-black ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                        {med.inventory_count}
                      </span>
                    </div>

                    {isLowStock && (
                      <span className="flex items-center space-x-1 text-rose-600 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        <span>Refill Needed</span>
                      </span>
                    )}
                  </div>

                  {/* Visual Pill Inventory Level Bar */}
                  <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${isLowStock ? 'bg-rose-500' : 'bg-teal-500'}`}
                      style={{ width: `${stockPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Add/Edit */}
      {modalOpen && (
        <AddMedicationModal
          initialMed={editingMed}
          onClose={() => {
            setModalOpen(false);
            setEditingMed(null);
          }}
          onSave={handleSaveMedication}
        />
      )}

    </div>
  );
};

export default MedicationsPage;
