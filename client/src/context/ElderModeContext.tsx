import React, { createContext, useContext, useState, useEffect } from 'react';

interface ElderModeContextType {
  isElderMode: boolean;
  toggleElderMode: () => void;
  speak: (text: string) => void;
}

const ElderModeContext = createContext<ElderModeContextType | undefined>(undefined);

export const ElderModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isElderMode, setIsElderMode] = useState<boolean>(() => {
    return localStorage.getItem('saathi_elder_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('saathi_elder_mode', String(isElderMode));
    if (isElderMode) {
      document.body.classList.add('elder-mode');
    } else {
      document.body.classList.remove('elder-mode');
    }
  }, [isElderMode]);

  const toggleElderMode = () => {
    setIsElderMode(prev => !prev);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower, clearer for seniors
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <ElderModeContext.Provider value={{ isElderMode, toggleElderMode, speak }}>
      {children}
    </ElderModeContext.Provider>
  );
};

export const useElderMode = () => {
  const context = useContext(ElderModeContext);
  if (!context) {
    throw new Error('useElderMode must be used within an ElderModeProvider');
  }
  return context;
};
