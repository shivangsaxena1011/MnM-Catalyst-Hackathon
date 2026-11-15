import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { NotificationItem } from '../types';
import {
  Bell, ShieldAlert, CheckCircle2, Clock, Mail,
  AlertTriangle, PlayCircle, CheckCheck
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { activePatient } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const res = await api.notifications.list(activePatient.id);
      setNotifications(res.notifications || []);
      setSmtpConfigured(res.smtpConfigured);
    } catch (err) {
      console.error('[Load Notifications Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [activePatient]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (notifId: number) => {
    if (!activePatient) return;
    try {
      await api.notifications.markRead(activePatient.id, notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: 1 } : n));
    } catch (err: any) {
      alert(err.message || 'Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    if (!activePatient) return;
    try {
      await api.notifications.markAllRead(activePatient.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err: any) {
      alert(err.message || 'Failed to mark all as read');
    }
  };

  const handleSimulateEscalation = async () => {
    if (!activePatient) return;
    setSimulating(true);
    try {
      await api.escalations.simulate(activePatient.id, { slot: 'morning', tier: 3 });
      await loadNotifications();
      alert('Simulated Tier 3 Caregiver Escalation dispatched. Check the alert banner and notifications list below.');
    } catch (err: any) {
      alert(err.message || 'Failed to simulate escalation');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-serif">Alerts & Notifications</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Central audit inbox for dose reminders, caregiver escalations, and appointments
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleSimulateEscalation}
            disabled={simulating}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            title="Trigger a test dose escalation alert"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{simulating ? 'Simulating...' : 'Test Escalation Alert'}</span>
          </button>

          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Honest SMTP Delivery Status Banner */}
      <div className={`p-4 rounded-3xl border flex items-start space-x-3 text-xs leading-relaxed ${
        smtpConfigured
          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
          : 'bg-amber-50/80 border-amber-300 text-amber-950'
      }`}>
        <Mail className={`w-5 h-5 shrink-0 mt-0.5 ${smtpConfigured ? 'text-emerald-600' : 'text-amber-600'}`} />
        <div>
          <span className="font-bold">
            {smtpConfigured ? 'Nodemailer SMTP Connected:' : 'Honest Email Status Warning:'}
          </span>{' '}
          {smtpConfigured
            ? 'Real emails are actively dispatched for caregiver escalations, unconfirmed doses, and appointments.'
            : 'SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are unconfigured. The system is operating in simulated email mode. All escalations and notifications are recorded in-app with full historical accuracy.'}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-lg mx-auto space-y-2">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 font-serif">No Notifications</h3>
          <p className="text-xs text-slate-500">You are all caught up on caregiver alerts and reminders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const isCritical = notif.priority === 'critical' || notif.type === 'escalation';
            const isRead = notif.is_read === 1;

            return (
              <div
                key={notif.id}
                onClick={() => !isRead && handleMarkRead(notif.id)}
                className={`glass-card p-5 transition-all cursor-pointer ${
                  !isRead ? 'border-teal-300 shadow-sm ring-1 ring-teal-400/20 bg-white/95' : 'opacity-85'
                } ${isCritical && !isRead ? 'bg-rose-50/50 border-rose-300 ring-rose-400/20' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold shadow-xs ${
                        isCritical
                          ? 'bg-rose-600 text-white'
                          : notif.type === 'appointment'
                          ? 'bg-teal-600 text-white'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {isCritical ? <ShieldAlert className="w-5 h-5" /> : notif.type === 'appointment' ? <Clock className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 font-serif">{notif.title}</span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            notif.priority === 'critical'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : notif.priority === 'high'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {notif.priority}
                        </span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                      <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-400 font-medium">
                        <span>{new Date(notif.created_at).toLocaleString()}</span>
                        <span>•</span>
                        <span>Email Status: {notif.email_status}</span>
                      </div>
                    </div>
                  </div>

                  {!isRead && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleMarkRead(notif.id);
                      }}
                      className="text-xs text-teal-700 hover:text-teal-900 font-bold shrink-0 cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default NotificationsPage;
