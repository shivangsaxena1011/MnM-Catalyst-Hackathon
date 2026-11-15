import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ElderModeProvider, useElderMode } from './context/ElderModeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DemoBanner } from './components/DemoBanner';
import { AiAssistantModal } from './components/AiAssistantModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { CareCirclePage } from './pages/CareCirclePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { TimelinePage } from './pages/TimelinePage';
import { SettingsPage } from './pages/SettingsPage';
import { ElderDashboardPage } from './pages/ElderDashboardPage';

const MainApp: React.FC = () => {
  const { user, patients, activePatient, loading } = useAuth();
  const { isElderMode } = useElderMode();

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [guestPage, setGuestPage] = useState<'landing' | 'auth'>('landing');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-700 tracking-wide">Loading SAATHI CARE...</p>
      </div>
    );
  }

  // If user is not logged in
  if (!user) {
    if (guestPage === 'auth') {
      return (
        <AuthPage
          onBack={() => setGuestPage('landing')}
          onSuccess={() => setCurrentPage('dashboard')}
        />
      );
    }
    return (
      <LandingPage
        onGetStarted={() => setGuestPage('auth')}
        onLogin={() => setGuestPage('auth')}
      />
    );
  }

  // If logged in but has no patient profile yet and not already on onboarding
  if (patients.length === 0 && currentPage !== 'onboarding') {
    return (
      <div>
        <Navbar
          onOpenAi={() => setAiModalOpen(true)}
          onNavigate={page => setCurrentPage(page)}
          currentPage={currentPage}
        />
        <DemoBanner />
        <OnboardingPage
          onBack={() => {}}
          onSuccess={() => setCurrentPage('dashboard')}
        />
        <AiAssistantModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
        />
      </div>
    );
  }

  // Active Authenticated View
  return (
    <div className="min-h-screen bg-[#FFF8F1] flex flex-col text-slate-800">
      <Navbar
        onOpenAi={() => setAiModalOpen(true)}
        onNavigate={page => setCurrentPage(page)}
        currentPage={currentPage}
      />

      <DemoBanner />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar (hidden on pure elder view if desired, or toggleable) */}
        {currentPage !== 'elder' && (
          <Sidebar
            currentPage={currentPage}
            onNavigate={page => setCurrentPage(page)}
            isSenior={user.role === 'senior'}
          />
        )}

        {/* Main Content Pane with Smooth Page Transitions */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${currentPage === 'elder' ? 'w-full' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {currentPage === 'dashboard' && (
                <DashboardPage
                  onNavigate={page => setCurrentPage(page)}
                  onOpenAi={() => setAiModalOpen(true)}
                />
              )}

              {currentPage === 'elder' && (
                <ElderDashboardPage
                  onBackToStandard={() => setCurrentPage('dashboard')}
                  onOpenAi={() => setAiModalOpen(true)}
                />
              )}

              {currentPage === 'medications' && <MedicationsPage />}
              {currentPage === 'history' && <HistoryPage />}
              {currentPage === 'appointments' && <AppointmentsPage />}
              {currentPage === 'care-circle' && <CareCirclePage />}
              {currentPage === 'notifications' && <NotificationsPage />}
              {currentPage === 'timeline' && <TimelinePage />}
              {currentPage === 'settings' && <SettingsPage />}

              {currentPage === 'onboarding' && (
                <OnboardingPage
                  onBack={() => setCurrentPage('dashboard')}
                  onSuccess={() => setCurrentPage('dashboard')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* AI Care Assistant Modal */}
      <AiAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ElderModeProvider>
        <MainApp />
      </ElderModeProvider>
    </AuthProvider>
  );
}
