import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Sparkles, X, Send, ShieldAlert } from 'lucide-react';
import { getErrorMessage } from '../utils/error';
import { useFeedback } from './ui/FeedbackProvider';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { notify } = useFeedback();
  const { activePatient } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    source: string;
    answer: string;
    disclaimer: string;
  } | null>(null);

  const prevFocusedElem = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAsk = async (questionText?: string) => {
    const q = questionText || query;
    if (!q.trim()) return;

    setLoading(true);
    setResponse(null);
    try {
      const res = await api.ai.explain({
        query: q,
        patient_id: activePatient?.id,
      });
      setResponse(res);
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Failed to get answer from AI Assistant'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'Explain how Metformin works',
    'When should Amlodipine be taken?',
    'What should I do if I miss a dose?',
    'Why is taking medicine with water important?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-modal-title"
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="glass-card max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 bg-white/95"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI assistant modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl signature-gradient text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h3 id="ai-modal-title" className="text-xl font-bold text-slate-900 flex items-center gap-2 font-serif">
              <span>SAATHI AI Care Assistant</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Safety Verified
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Compassionate, plain-language explanations of medications and schedules
            </p>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 mb-5 text-xs text-amber-950 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Clinical Safety Protocol:</strong> This assistant provides educational guidance only. It will never diagnose illness, alter dosages, or change prescriptions. If feeling unwell, contact your attending physician immediately.
          </div>
        </div>

        {/* Sample Prompt Pills */}
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Frequently Asked Questions:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(q);
                  handleAsk(q);
                }}
                className="text-xs bg-amber-50/60 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 text-slate-700 px-3 py-1.5 rounded-xl border border-amber-200/80 transition-all cursor-pointer font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center space-x-2 mb-5"
        >
          <label htmlFor="ai-query-input" className="sr-only">Ask a question about your medication</label>
          <input
            id="ai-query-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask about your medicine instructions (e.g. Can I take this with milk?)"
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            aria-label="Send question to AI assistant"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-2xl signature-btn text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center space-x-1 py-1">
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
              </div>
            ) : (
              <>
                <span>Ask</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Response Chat-Bubble */}
        {response && (
          <div className="bg-gradient-to-br from-teal-50/50 to-amber-50/40 border border-teal-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 border-b border-amber-200/60 pb-2">
              <span className="font-bold text-teal-800 flex items-center gap-1.5">
                <img src="/logo-icon.png" alt="" className="w-4 h-4 object-contain inline-block" />
                <span>Guidance for {activePatient?.full_name || 'Patient'}</span>
              </span>
              <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold">
                Engine: {response.source === 'gemini' ? 'Gemini AI' : 'Clinical Rule Engine'}
              </span>
            </div>

            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
              {response.answer}
            </div>

            <div className="text-[11px] text-slate-500 italic pt-2 border-t border-amber-200/60">
              {response.disclaimer}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AiAssistantModal;
