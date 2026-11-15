import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

/**
 * Accessible replacement for window.alert / window.confirm.
 * - Toasts are announced through an aria-live region and auto-dismiss.
 * - Confirm dialogs are real modal dialogs (role="alertdialog") with focus
 *   management, Escape-to-cancel and focus restoration.
 */

export type ToastTone = 'success' | 'error' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions render the confirm button in rose. */
  destructive?: boolean;
}

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface FeedbackContextValue {
  notify: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const TOAST_DURATION_MS = 4500;

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

const TONE_STYLES: Record<ToastTone, { icon: React.ReactNode; className: string; label: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />,
    className: 'border-emerald-200',
    label: 'Success',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />,
    className: 'border-rose-200',
    label: 'Error',
  },
  info: {
    icon: <Info className="w-5 h-5 text-teal-600 shrink-0" aria-hidden="true" />,
    className: 'border-teal-200',
    label: 'Notice',
  },
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts(current => current.filter(t => t.id !== id));
  }, []);

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current++;
    setToasts(current => [...current, { id, message, tone }]);
    window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
  }, [dismiss]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    setPending(current => {
      current?.resolve(value);
      return null;
    });
  }, []);

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}

      {/* Toast region — polite announcements for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 left-4 sm:left-auto z-[70] flex flex-col items-stretch sm:items-end gap-2 pointer-events-none"
      >
        <AnimatePresence initial={false}>
          {toasts.map(toast => {
            const tone = TONE_STYLES[toast.tone];
            return (
              <motion.div
                key={toast.id}
                role={toast.tone === 'error' ? 'alert' : 'status'}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto w-full sm:w-96 flex items-start gap-3 rounded-2xl border bg-white/95 backdrop-blur-xl px-4 py-3 shadow-xl ${tone.className}`}
              >
                {tone.icon}
                <p className="flex-1 text-sm font-semibold text-slate-800">
                  <span className="sr-only">{tone.label}: </span>
                  {toast.message}
                </p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {pending && <ConfirmDialog options={pending} onSettle={settle} />}
      </AnimatePresence>
    </FeedbackContext.Provider>
  );
};

interface ConfirmDialogProps {
  options: ConfirmOptions;
  onSettle: (value: boolean) => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ options, onSettle }) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the safe choice first so an accidental Enter never deletes data.
    cancelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSettle(false);
      } else if (e.key === 'Tab') {
        // Two-button focus trap
        const first = cancelRef.current;
        const last = confirmRef.current;
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onSettle]);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => onSettle(false)}
    >
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100"
      >
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-2xl ${options.destructive ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'}`}>
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-extrabold text-slate-900">
              {options.title}
            </h2>
            <p id="confirm-dialog-message" className="mt-1 text-sm text-slate-600 leading-relaxed">
              {options.message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onSettle(false)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
          >
            {options.cancelLabel ?? 'Cancel'}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onSettle(true)}
            className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-md cursor-pointer ${
              options.destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {options.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Access toast notifications and confirm dialogs.
 * Must be used inside <FeedbackProvider>.
 */
export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return ctx;
}
