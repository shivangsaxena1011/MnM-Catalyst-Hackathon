import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Patient } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  patients: Patient[];
  activePatient: Patient | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  passcodeLogin: (payload: { email: string; passcode: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; passcode?: string; role: string; phone?: string }) => Promise<void>;
  logout: () => void;
  selectPatient: (patientId: number) => void;
  refreshPatients: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshPatients = useCallback(async () => {
    try {
      const data = await api.patients.list();
      setPatients(data.patients);
      if (data.patients.length > 0) {
        // Keep current selected if valid, or default to first
        const savedId = localStorage.getItem('saathi_active_patient_id');
        const match = data.patients.find(p => p.id === Number(savedId));
        const selected = match || data.patients[0];
        setActivePatient(selected);
        localStorage.setItem('saathi_active_patient_id', String(selected.id));
      } else {
        setActivePatient(null);
        localStorage.removeItem('saathi_active_patient_id');
      }
    } catch (err) {
      console.error('[Refresh Patients Error]:', err);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('saathi_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.auth.me();
      setUser(data.user);
      setPatients(data.patients);

      if (data.patients.length > 0) {
        const savedId = localStorage.getItem('saathi_active_patient_id');
        const match = data.patients.find(p => p.id === Number(savedId));
        const selected = match || data.patients[0];
        setActivePatient(selected);
        localStorage.setItem('saathi_active_patient_id', String(selected.id));
      }
    } catch (err) {
      console.warn('[Session expired or invalid token]:', err);
      localStorage.removeItem('saathi_token');
      localStorage.removeItem('saathi_active_patient_id');
      setUser(null);
      setActivePatient(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = async (payload: { email: string; password: string }) => {
    const res = await api.auth.login(payload);
    localStorage.setItem('saathi_token', res.token);
    setUser(res.user);
    await refreshPatients();
  };

  const passcodeLogin = async (payload: { email: string; passcode: string }) => {
    const res = await api.auth.passcodeLogin(payload);
    localStorage.setItem('saathi_token', res.token);
    setUser(res.user);
    await refreshPatients();
  };

  const register = async (payload: { name: string; email: string; password: string; passcode?: string; role: string; phone?: string }) => {
    const res = await api.auth.register(payload);
    localStorage.setItem('saathi_token', res.token);
    setUser(res.user);
    await refreshPatients();
  };

  const logout = () => {
    localStorage.removeItem('saathi_token');
    localStorage.removeItem('saathi_active_patient_id');
    setUser(null);
    setActivePatient(null);
    setPatients([]);
  };

  const selectPatient = (patientId: number) => {
    const match = patients.find(p => p.id === patientId);
    if (match) {
      setActivePatient(match);
      localStorage.setItem('saathi_active_patient_id', String(patientId));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patients,
        activePatient,
        loading,
        login,
        passcodeLogin,
        register,
        logout,
        selectPatient,
        refreshPatients,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
