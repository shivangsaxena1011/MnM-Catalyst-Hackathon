import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { CareCircleMember } from '../types';
import { getErrorMessage } from '../utils/error';
import {
  Users, Copy, Check, Shield, UserCheck,
  UserX, Phone, Mail, Sparkles, KeyRound
} from 'lucide-react';
import { useFeedback } from '../components/ui/FeedbackProvider';

export const CareCirclePage: React.FC = () => {
  const { notify, confirm: confirmAction } = useFeedback();
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
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Failed to update permissions'), 'error');
    }
  };

  const handleRemoveMember = async (member: CareCircleMember) => {
    if (!activePatient) return;
    if (!(await confirmAction({ title: 'Remove member?', message: `Remove ${member.name} from this Care Circle?`, confirmLabel: 'Remove', destructive: true }))) return;
    try {
      await api.patients.removeMember(activePatient.id, member.membership_id);
      await loadCareCircle();
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Failed to remove member'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-serif">Care Circle Roster</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Authorized family members and professional caregivers collaborating on {activePatient?.full_name}'s care
        </p>
      </div>

      {/* Large Copyable Invite Ticket */}
      <div className="glass-card p-6 sm:p-8 bg-gradient-to-r from-teal-50/90 via-amber-50/50 to-rose-50/40 border-2 border-dashed border-teal-300 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-bold">
              <KeyRound className="w-3.5 h-3.5" />
              <span>PATIENT INVITE PASS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-slate-900 mt-2">
              {activePatient?.invite_code || 'SAATHI-XXXX'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md pt-1">
              Share this secure code with family members or nurses so they can join {activePatient?.full_name}'s Care Circle directly from their accounts.
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-6 py-4 rounded-2xl signature-btn text-white font-extrabold text-sm shadow-md hover:scale-102 active:scale-98 transition-all flex items-center space-x-2.5 cursor-pointer self-start sm:self-auto shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-amber-200" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copy Invite Passcode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Members Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 font-serif">
          <Users className="w-5 h-5 text-teal-600" />
          <span>Active Circle Members ({members.length})</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading circle members...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {members.map(member => (
              <div
                key={member.membership_id}
                className="glass-card p-6 glass-card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    {/* Avatar with Gradient Initials */}
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl signature-gradient text-white flex items-center justify-center font-bold text-lg shadow-xs">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 font-serif leading-tight">{member.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">Relationship: {member.relationship}</p>
                      </div>
                    </div>

                    {member.role !== 'senior' && (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Role Badge */}
                  <div className="mb-3">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        member.role === 'senior'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300/80'
                          : member.role === 'caregiver'
                          ? 'bg-teal-100 text-teal-900 border border-teal-300/80'
                          : 'bg-rose-100 text-rose-900 border border-rose-300/80'
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-amber-50/40 p-3 rounded-2xl border border-amber-100">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center space-x-2 font-medium text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-amber-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 font-medium">
                      {member.can_edit ? 'Can edit prescriptions' : 'View only access'}
                    </span>
                  </div>

                  {member.role !== 'senior' && (
                    <button
                      onClick={() => handleToggleEdit(member)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors cursor-pointer ${
                        member.can_edit
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
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

export default CareCirclePage;
