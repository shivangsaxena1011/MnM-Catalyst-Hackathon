import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ElderModeProvider, useElderMode } from './context/ElderModeContext';
import { FeedbackProvider } from './components/ui/FeedbackProvider';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DemoBanner } from './components/DemoBanner';
import { AiAssistantModal } from './components/AiAssistantModal';

// Eagerly loaded for instant landing & login
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';

// Lazy-loaded authenticated application pages
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MedicationsPage = lazy(() => import('./pages/MedicationsPage').then(m => ({ default: m.MedicationsPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const CareCirclePage = lazy(() => import('./pages/CareCirclePage').then(m => ({ default: m.CareCirclePage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const TimelinePage = lazy(() => import('./pages/TimelinePage').then(m => ({ default: m.TimelinePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ElderDashboardPage = lazy(() => import('./pages/ElderDashboardPage').then(m => ({ default: m.ElderDashboardPage })));

const PageFallback = () => (
  <div className="py-16 flex flex-col items-center justify-center space-y-3">
    <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-500">Loading section...</span>
  </div>
);

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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-xl focus:shadow-lg focus:font-bold focus:text-xs"
        >
          Skip to main content
        </a>
        <Navbar
          onOpenAi={() => setAiModalOpen(true)}
          onNavigate={page => setCurrentPage(page)}
          currentPage={currentPage}
        />
        <DemoBanner />
        <main id="main">
          <Suspense fallback={<PageFallback />}>
            <OnboardingPage
              onBack={() => {}}
              onSuccess={() => setCurrentPage('dashboard')}
            />
          </Suspense>
        </main>
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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-xl focus:shadow-lg focus:font-bold focus:text-xs"
      >
        Skip to main content
      </a>

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
        <main id="main" className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${currentPage === 'elder' ? 'w-full' : ''}`}>
          <Suspense fallback={<PageFallback />}>
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
          </Suspense>
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
        <FeedbackProvider>
          <MainApp />
        </FeedbackProvider>
      </ElderModeProvider>
    </AuthProvider>
  );
}
