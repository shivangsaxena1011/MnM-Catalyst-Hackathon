import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { CareCircleMember } from '../types';
import {
  Users, Copy, Check, Shield, UserCheck,
  UserX, Phone, Mail, Sparkles
} from 'lucide-react';

export const CareCirclePage: React.FC = () => {
  const { activePatient } = useAuth();
  const [members, setMembers] = useState<CareCircleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadCareCircle = useCallback(async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const res = await api.patients.get(activePatient.id);
      setMembers(res.care_circle || []);
    } catch (err) {
      console.error('[Load Care Circle Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [activePatient]);

  useEffect(() => {
    loadCareCircle();
  }, [loadCareCircle]);

  const handleCopyCode = () => {
    if (!activePatient) return;
    navigator.clipboard.writeText(activePatient.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleToggleEdit = async (member: CareCircleMember) => {
    if (!activePatient) return;
    try {
      await api.patients.updateMemberPermission(activePatient.id, member.membership_id, {
        can_edit: !member.can_edit,
      });
      await loadCareCircle();
    } catch (err: any) {
      alert(err.message || 'Failed to update permissions');
    }
  };

  const handleRemoveMember = async (member: CareCircleMember) => {
    if (!activePatient) return;
    if (!window.confirm(`Remove ${member.name} from this Care Circle?`)) return;
    try {
      await api.patients.removeMember(activePatient.id, member.membership_id);
      await loadCareCircle();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1E33]">Care Circle Roster</h1>
        <p className="text-xs text-slate-500 font-medium">
          Authorized family members and professional caregivers collaborating on {activePatient?.full_name}'s care
        </p>
      </div>

      {/* Invite Code Share Card */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 text-teal-100 px-2.5 py-0.5 rounded-full">
              Patient Invite Code
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-wider mt-1">
              {activePatient?.invite_code || 'SAATHI-XXXX'}
            </h2>
            <p className="text-xs text-teal-100 max-w-md">
              Share this secure code with family members or nurses so they can join this Care Circle directly from their dashboard.
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-5 py-3 rounded-2xl bg-white text-teal-900 font-bold text-sm shadow-lg hover:bg-teal-50 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied Code!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-teal-700" />
                <span>Copy Invite Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Members Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Users className="w-5 h-5 text-teal-600" />
          <span>Active Circle Members ({members.length})</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading circle members...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => (
              <div
                key={member.membership_id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        member.role === 'senior'
                          ? 'bg-amber-100 text-amber-900'
                          : member.role === 'caregiver'
                          ? 'bg-teal-100 text-teal-900'
                          : 'bg-indigo-100 text-indigo-900'
                      }`}
                    >
                      {member.role}
                    </span>

                    {member.role !== 'senior' && (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{member.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Relationship: {member.relationship}</p>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center space-x-2 font-medium text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500">
                      {member.can_edit ? 'Can edit prescriptions' : 'View only access'}
                    </span>
                  </div>

                  {member.role !== 'senior' && (
                    <button
                      onClick={() => handleToggleEdit(member)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        member.can_edit
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                      }`}
                    >
                      {member.can_edit ? 'Make View-Only' : 'Grant Edit'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
