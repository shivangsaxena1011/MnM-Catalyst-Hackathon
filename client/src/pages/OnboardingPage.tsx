import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';

interface OnboardingPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onBack, onSuccess }) => {
  const { refreshPatients } = useAuth();
  const [mode, setMode] = useState<'create' | 'join'>('create');

  // Create Patient Form
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>(70);
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [relationship, setRelationship] = useState('Self');

  // Join Form
  const [inviteCode, setInviteCode] = useState('');
  const [joinRelationship, setJoinRelationship] = useState('Daughter');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !age) {
      setError('Please provide patient name and age');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.patients.create({
        full_name: fullName.trim(),
        age: Number(age),
        gender,
        blood_group: bloodGroup,
        conditions: conditions.trim() || undefined,
        allergies: allergies.trim() || undefined,
        emergency_contact_name: emergencyContactName.trim() || undefined,
        emergency_contact_phone: emergencyContactPhone.trim() || undefined,
        emergency_contact_relation: emergencyContactRelation.trim() || undefined,
        relationship,
      });
      await refreshPatients();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create patient profile');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter the 6-character Care Circle invite code');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.patients.join({
        invite_code: inviteCode.trim().toUpperCase(),
        relationship: joinRelationship,
      });
      await refreshPatients();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to join Care Circle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-3xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#0B1E33]">Care Circle Setup</h2>
          <p className="mt-1 text-sm text-slate-500">
            Set up an elder profile or connect with an existing family member’s circle
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1.5 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => { setMode('create'); setError(null); }}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              mode === 'create' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4 text-teal-600" />
            <span>Create New Profile</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('join'); setError(null); }}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              mode === 'join' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4 text-teal-600" />
            <span>Join with Invite Code</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl p-4 font-medium">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Senior Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    min={40}
                    max={120}
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Relationship</label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={e => setRelationship(e.target.value)}
                    placeholder="e.g. Self, Daughter, Son, Nurse"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Existing Health Conditions</label>
                <input
                  type="text"
                  value={conditions}
                  onChange={e => setConditions(e.target.value)}
                  placeholder="e.g. Hypertension, Type 2 Diabetes, Arthritis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Known Drug Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, None"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Primary Emergency Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={e => setEmergencyContactName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={e => setEmergencyContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Relation</label>
                    <input
                      type="text"
                      value={emergencyContactRelation}
                      onChange={e => setEmergencyContactRelation(e.target.value)}
                      placeholder="e.g. Daughter"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-700/20 transition-all cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? 'Creating Profile...' : 'Create Care Profile & Generate Invite Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200 text-xs text-teal-900 leading-relaxed">
                🔑 Enter the unique <strong>SAATHI-XXXX</strong> invite code provided by the senior or the primary caregiver to securely join their Care Circle.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Care Circle Invite Code *</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAATHI-8291"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center font-mono font-bold text-lg tracking-wider focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Relationship to the Patient *</label>
                <input
                  type="text"
                  required
                  value={joinRelationship}
                  onChange={e => setJoinRelationship(e.target.value)}
                  placeholder="e.g. Daughter, Son, Visiting Nurse, Sibling"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-700/20 transition-all cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? 'Verifying Code...' : 'Join Care Circle'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
