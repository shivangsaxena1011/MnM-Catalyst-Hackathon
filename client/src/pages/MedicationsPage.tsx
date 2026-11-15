import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Medication } from '../types';
import { AddMedicationModal } from '../components/AddMedicationModal';
import {
  Pill, Plus, Edit2, Trash2, AlertCircle, Clock
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
    } catch (err: any) {
      alert(err.message || 'Failed to delete medication');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1E33]">Medication Management</h1>
          <p className="text-xs text-slate-500 font-medium">
            Active prescriptions, dosages, and refill alerts for {activePatient?.full_name}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMed(null);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-700/20 flex items-center space-x-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Medication List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading prescriptions...</div>
      ) : medications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 max-w-lg mx-auto">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Prescriptions Added Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
            Keep your loved one’s care circle coordinated by adding their daily medicines, dosages, and meal instructions.
          </p>
          <button
            onClick={() => {
              setEditingMed(null);
              setModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm"
          >
            + Add First Medication
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map(med => {
            const isLowStock = med.inventory_count <= med.refill_alert_threshold;

            return (
              <div
                key={med.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {med.schedule_slots.map((slot, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingMed(med);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMedication(med.id, med.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Discontinue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Generic */}
                  <h3 className="text-lg font-bold text-[#0B1E33] leading-snug">{med.name}</h3>
                  {med.generic_name && (
                    <p className="text-xs text-slate-400 font-medium italic mb-2">
                      Generic: {med.generic_name}
                    </p>
                  )}

                  {/* Dosage & Form */}
                  <div className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg my-2">
                    {med.dosage} • {med.form}
                  </div>

                  {/* Instructions */}
                  {med.instructions && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      <strong>Instructions:</strong> {med.instructions}
                    </p>
                  )}

                  {/* Meal timing */}
                  <div className="flex items-center space-x-1.5 text-xs text-teal-800 font-medium mt-2">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Take {med.meal_timing.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Footer with Pill Stock */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Pills Remaining:</span>{' '}
                    <span className={`font-bold ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                      {med.inventory_count}
                    </span>
                  </div>

                  {isLowStock && (
                    <span className="flex items-center space-x-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Refill Needed</span>
                    </span>
                  )}

                  {med.prescribed_by && (
                    <span className="text-slate-400 truncate max-w-[120px]" title={med.prescribed_by}>
                      Dr. {med.prescribed_by}
                    </span>
                  )}
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
