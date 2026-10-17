import { useState, useEffect } from 'react';
import { ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { planTrip } from './api';
import type { TripPlanResponse, TripRequest } from './types';
import LandingPage from './components/LandingPage';
import WizardPage, { defaultRequest } from './components/WizardPage';
import ResultsPage from './components/ResultsPage';
import LoadingOverlay from './components/LoadingOverlay';
import { parseShareUrl } from './utils/exportUtils';

export default function App() {
  const [page, setPage] = useState<'home' | 'wizard' | 'results'>('home');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TripRequest>(defaultRequest);
  const [plan, setPlan] = useState<TripPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          <span className="secure-note"><ShieldCheck size={15} /> Thoughtful travel, smarter budgets</span>
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
          onEditTrip={() => { setPage('wizard'); setStep(2); }}
          onNewTrip={() => { setPage('wizard'); setStep(0); }}
        />
      )}

      {/* ─── Global Footer ─── */}
      <footer className="global-footer">
        <span>© 2026 Tripwise AI</span>
        <span>Plan thoughtfully. Travel freely.</span>
        <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify place data, when configured</a>
      </footer>
    </div>
  );
}
