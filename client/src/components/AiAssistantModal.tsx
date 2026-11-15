import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Sparkles, X, Send, ShieldAlert, HeartHandshake } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { activePatient } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    source: string;
    answer: string;
    disclaimer: string;
  } | null>(null);

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
    } catch (err: any) {
      alert(err.message || 'Failed to get answer from AI Assistant');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <Sparkles className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0B1E33] flex items-center gap-2">
              <span>SAATHI AI Care Assistant</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Safety Verified
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Compassionate, plain-language explanations of your medications and schedules
            </p>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 mb-5 text-xs text-amber-900 flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Clinical Safety Protocol:</strong> This assistant provides educational guidance only. It will never diagnose illness, alter dosages, or change prescriptions. If feeling unwell, contact your doctor immediately.
          </div>
        </div>

        {/* Sample Prompt Pills */}
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Frequently Asked:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(q);
                  handleAsk(q);
                }}
                className="text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer font-medium"
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
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask about your medicine instructions (e.g. Can I take this with milk?)"
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Ask</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Response Box */}
        {response && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200/80 pb-2">
              <span className="font-semibold text-teal-700 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4" />
                <span>Guidance for {activePatient?.full_name || 'Patient'}</span>
              </span>
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                Engine: {response.source === 'gemini' ? 'Gemini AI' : 'Clinical Rule Engine'}
              </span>
            </div>

            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
              {response.answer}
            </div>

            <div className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-200">
              {response.disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
