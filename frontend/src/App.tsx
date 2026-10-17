import { useState, useEffect } from 'react';
import { ArrowRight, BookmarkCheck, Compass, LogOut } from 'lucide-react';
import { getCurrentUser, getSavedUser, logout, planTrip } from './api';
import type { TripPlanResponse, TripRequest, User } from './types';
import LandingPage from './components/LandingPage';
import WizardPage, { defaultRequest } from './components/WizardPage';
import ResultsPage from './components/ResultsPage';
import LoadingOverlay from './components/LoadingOverlay';
import GoogleAuthModal from './components/GoogleAuthModal';
import SavedTripsModal from './components/SavedTripsModal';
import { parseShareUrl } from './utils/exportUtils';

export default function App() {
  const [page, setPage] = useState<'home' | 'wizard' | 'results'>('home');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TripRequest>(defaultRequest);
  const [plan, setPlan] = useState<TripPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Authentication & Saved Trips State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getSavedUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [savedTripsModalOpen, setSavedTripsModalOpen] = useState(false);

  // Sync current user session on mount
  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setCurrentUser(u);
    });
  }, []);

  // Handle shared trip URL on load
  useEffect(() => {
    const shared = parseShareUrl();
    if (shared) {
      setForm(shared as TripRequest);
      setPage('wizard');
      setStep(2);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  async function generatePlan() {
    setLoading(true);
    setError('');
    try {
      const result = await planTrip({
        ...form,
        destination: form.destination.trim(),
        origin: form.origin.trim(),
      });
      setPlan(result);
      setPage('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate your trip. Is the Spring Boot API running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      {/* ─── Header ─── */}
      <header className="topbar">
        <button className="brand" onClick={() => setPage('home')} aria-label="Tripwise home">
          <span className="brand-mark"><Compass size={20} /></span>
          <span>tripwise<span className="brand-ai"> AI</span></span>
        </button>
        <nav className="desktop-nav">
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); setPage('home'); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>How it works</a>
          <a href="#features" onClick={(e) => { e.preventDefault(); setPage('home'); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a>
        </nav>
        <div className="topbar-actions">
          {currentUser ? (
            <div className="topbar-user-profile">
              <button
                type="button"
                className="button button-small topbar-my-trips-btn"
                onClick={() => setSavedTripsModalOpen(true)}
                title="View your saved trips in database"
              >
                <BookmarkCheck size={14} /> My Trips
              </button>

              <div className="topbar-user-pill">
                <div className="user-avatar-tiny">
                  {currentUser.pictureUrl ? (
                    <img src={currentUser.pictureUrl} alt={currentUser.name} />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span>{currentUser.name.split(' ')[0]}</span>
              </div>

              <button
                type="button"
                className="topbar-logout-btn"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="button button-outline button-small topbar-auth-btn"
              onClick={() => setAuthModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in</span>
            </button>
          )}

          <button className="button button-dark button-small" onClick={() => { setPage('wizard'); setStep(0); }}>
            Plan a trip <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* ─── Loading Overlay ─── */}
      {loading && <LoadingOverlay />}

      {/* ─── Pages ─── */}
      {page === 'home' && (
        <LandingPage onStartPlanning={() => { setPage('wizard'); setStep(0); }} />
      )}

      {page === 'wizard' && (
        <WizardPage
          form={form}
          setForm={setForm}
          step={step}
          setStep={setStep}
          loading={loading}
          error={error}
          onGoHome={() => setPage('home')}
          onGenerate={generatePlan}
        />
      )}

      {page === 'results' && plan && (
        <ResultsPage
          plan={plan}
          currentUser={currentUser}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          onEditTrip={() => { setPage('wizard'); setStep(2); }}
          onNewTrip={() => { setPage('wizard'); setStep(0); }}
          onPlanUpdate={setPlan}
        />
      )}

      {/* ─── Modals ─── */}
      <GoogleAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => setCurrentUser(u)}
      />

      <SavedTripsModal
        isOpen={savedTripsModalOpen}
        user={currentUser}
        onClose={() => setSavedTripsModalOpen(false)}
        onSelectTrip={(loadedPlan) => {
          setPlan(loadedPlan);
          setPage('results');
        }}
      />

      {/* ─── Global Footer ─── */}
      <footer className="global-footer">
        <span>© 2026 Tripwise AI</span>
        <span>Plan thoughtfully. Travel freely.</span>
        <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify place data, when configured</a>
      </footer>
    </div>
  );
}
