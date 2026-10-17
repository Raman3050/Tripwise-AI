import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight,
  CircleHelp, LoaderCircle, MapPin, Plus, ShieldCheck,
  Sparkles, Users, Wallet,
} from 'lucide-react';
import type { TripRequest } from '../types';

const interestsList = ['Culture', 'Food', 'Nature', 'Adventure', 'Photography', 'Shopping', 'Relaxation'];
const today = new Date();
const addDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const defaultRequest: TripRequest = {
  origin: 'Delhi, India',
  destination: 'Jaipur, India',
  startDate: addDays(14),
  endDate: addDays(17),
  travelers: 2,
  budgetInr: 30000,
  travelStyle: 'balanced',
  preferredTransport: 'cheapest',
  interests: ['Culture', 'Food', 'Photography'],
};

interface WizardPageProps {
  form: TripRequest;
  setForm: React.Dispatch<React.SetStateAction<TripRequest>>;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  error: string;
  onGoHome: () => void;
  onGenerate: () => void;
}

export default function WizardPage({
  form, setForm, step, setStep, loading, error, onGoHome, onGenerate,
}: WizardPageProps) {
  const validDates = Boolean(form.startDate && form.endDate && form.endDate >= form.startDate);
  const canContinue = step === 0
    ? form.destination.trim().length > 1
    : step === 1
      ? form.origin.trim().length > 1
      : validDates && form.travelers > 0 && form.budgetInr > 0;

  const update = <K extends keyof TripRequest>(key: K, value: TripRequest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <main className="wizard-page">
      <div className="wizard-backrow">
        <button className="text-button" onClick={() => step === 0 ? onGoHome() : setStep((s) => s - 1)}>
          <ArrowLeft size={16} /> {step === 0 ? 'Back home' : 'Previous step'}
        </button>
        <span>LET'S MAKE IT HAPPEN</span>
      </div>

      <div className="wizard-layout">
        <div className="wizard-main">
          {/* ─── Progress Header ─── */}
          <div className="progress-head">
            <div>
              <div className="section-kicker">STEP {step + 1} OF 3</div>
              <h1>{step === 0 ? 'Where to next?' : step === 1 ? 'Where are you starting?' : "Let's shape your trip."}</h1>
              <p>{step === 0 ? "Pick the place that's been on your mind." : step === 1 ? "We'll use this to compare ways to get there." : "Tell us when you're going and what matters most."}</p>
            </div>
            <div className="progress-count">0{step + 1}<span> / 03</span></div>
          </div>
          <div className="progress-track"><i style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>

          {/* ─── Step 0: Destination ─── */}
          {step === 0 && (
            <div className="form-panel">
              <label className="field-label" htmlFor="destination">Your destination</label>
              <div className="input-wrap input-big">
                <MapPin size={19} />
                <input id="destination" autoFocus placeholder="Try Jaipur, Bali or the Swiss Alps"
                  value={form.destination} onChange={(e) => update('destination', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canContinue && setStep(1)} />
              </div>
              <div className="field-hint">A city, region or country — wherever your curiosity leads.</div>
              <div className="suggestion-label">A LITTLE INSPIRATION</div>
              <div className="destination-ideas">
                {[
                  { name: 'Jaipur', meta: 'Culture & colour', emoji: '🏯' },
                  { name: 'Goa', meta: 'Coast & calm', emoji: '🌴' },
                  { name: 'Manali', meta: 'Mountains & trails', emoji: '🏔️' },
                ].map((d) => (
                  <button className={`destination-chip ${form.destination.toLowerCase().startsWith(d.name.toLowerCase()) ? 'selected' : ''}`}
                    key={d.name} onClick={() => update('destination', `${d.name}, India`)}>
                    <span>{d.emoji}</span><b>{d.name}</b><small>{d.meta}</small><ChevronRight size={15} />
                  </button>
                ))}
              </div>
              <div className="form-bottom">
                <span><ShieldCheck size={15} /> Your trip details stay yours.</span>
                <button className="button button-primary" disabled={!canContinue} onClick={() => setStep(1)}>
                  Next step <ArrowRight size={17} />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 1: Origin ─── */}
          {step === 1 && (
            <div className="form-panel">
              <label className="field-label" htmlFor="origin">Your starting point</label>
              <div className="input-wrap input-big">
                <MapPin size={19} />
                <input id="origin" autoFocus placeholder="City, airport or address"
                  value={form.origin} onChange={(e) => update('origin', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canContinue && setStep(2)} />
              </div>
              <div className="field-hint">We'll compare travel ideas from here to {form.destination || 'your destination'}.</div>
              <div className="route-preview">
                <div className="route-dot start-dot" />
                <div className="route-preview-line" />
                <div className="route-dot end-dot" />
                <div className="route-preview-labels">
                  <div><small>STARTING FROM</small><b>{form.origin || 'Your city'}</b></div>
                  <div><small>HEADING TO</small><b>{form.destination || 'Your destination'}</b></div>
                </div>
              </div>
              <div className="form-bottom">
                <span><ShieldCheck size={15} /> We'll compare practical options.</span>
                <button className="button button-primary" disabled={!canContinue} onClick={() => setStep(2)}>
                  Next step <ArrowRight size={17} />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Details ─── */}
          {step === 2 && (
            <div className="form-panel details-form">
              <div className="two-fields">
                <div>
                  <label className="field-label" htmlFor="startDate">Departure date</label>
                  <div className="input-wrap">
                    <CalendarDays size={17} />
                    <input id="startDate" type="date" min={addDays(0)} value={form.startDate}
                      onChange={(e) => { update('startDate', e.target.value); if (form.endDate < e.target.value) update('endDate', e.target.value); }} />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="endDate">Return date</label>
                  <div className="input-wrap">
                    <CalendarDays size={17} />
                    <input id="endDate" type="date" min={form.startDate || addDays(0)} value={form.endDate}
                      onChange={(e) => update('endDate', e.target.value)} />
                  </div>
                </div>
              </div>
              {!validDates && <p className="field-error">Return date must be on or after the departure date.</p>}

              <div className="two-fields">
                <div>
                  <label className="field-label" htmlFor="travelers">Travelers</label>
                  <div className="number-control">
                    <button onClick={() => update('travelers', Math.max(1, form.travelers - 1))} disabled={form.travelers <= 1}>−</button>
                    <span><Users size={16} />{form.travelers} {form.travelers === 1 ? 'traveler' : 'travelers'}</span>
                    <button onClick={() => update('travelers', Math.min(12, form.travelers + 1))} disabled={form.travelers >= 12}><Plus size={15} /></button>
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="budget">Total budget (₹)</label>
                  <div className="input-wrap">
                    <Wallet size={17} />
                    <input id="budget" type="number" min="1000" step="1000" value={form.budgetInr}
                      onChange={(e) => update('budgetInr', Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="field-block">
                <div className="field-label">What's your travel vibe?</div>
                <div className="choice-row">
                  {([
                    { value: 'budget' as const, label: 'Keep it light', sub: 'Budget', icon: '₹' },
                    { value: 'balanced' as const, label: 'A bit of both', sub: 'Balanced', icon: '◒' },
                    { value: 'comfort' as const, label: 'Treat yourself', sub: 'Comfort', icon: '✦' },
                  ]).map((c) => (
                    <button key={c.value} className={`choice-card ${form.travelStyle === c.value ? 'selected' : ''}`}
                      onClick={() => update('travelStyle', c.value)}>
                      <span className="choice-symbol">{c.icon}</span><b>{c.label}</b><small>{c.sub}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field-block">
                <div className="field-label">How would you like to travel?</div>
                <div className="transport-choice-grid">
                  {([
                    { value: 'cheapest' as const, label: 'Cheapest', icon: '₹' },
                    { value: 'fastest' as const, label: 'Fastest', icon: '↗' },
                    { value: 'train' as const, label: 'Train', icon: '🚆' },
                    { value: 'bus' as const, label: 'Bus', icon: '🚌' },
                    { value: 'flight' as const, label: 'Flight', icon: '✈️' },
                    { value: 'car' as const, label: 'Drive', icon: '🚗' },
                  ]).map((choice) => (
                    <button key={choice.value} className={`transport-choice ${form.preferredTransport === choice.value ? 'selected' : ''}`}
                      onClick={() => update('preferredTransport', choice.value)}>
                      <span>{choice.icon}</span><b>{choice.label}</b>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field-block">
                <div className="field-label">What would you love to do?</div>
                <div className="interest-list">
                  {interestsList.map((interest) => (
                    <button key={interest}
                      className={`interest-pill ${form.interests.includes(interest) ? 'selected' : ''}`}
                      onClick={() => update('interests', form.interests.includes(interest)
                        ? form.interests.filter((i) => i !== interest) : [...form.interests, interest])}>
                      {form.interests.includes(interest) && <Check size={13} />} {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-bottom">
                <span><Sparkles size={15} /> We'll take it from here.</span>
                <button className="button button-primary" disabled={!canContinue || loading} onClick={onGenerate}>
                  {loading
                    ? <><LoaderCircle className="spin" size={17} /> Planning...</>
                    : <>Build my trip <Sparkles size={16} /></>}
                </button>
              </div>
              {error && (
                <div className="error-banner">
                  <CircleHelp size={17} />
                  <span>{error}<br /><small>Make sure the Spring Boot API is running at localhost:8080.</small></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Sidebar ─── */}
        <aside className="wizard-aside">
          <div className="aside-art">
            <div className="aside-orbit orbit-a" />
            <div className="aside-orbit orbit-b" />
            <span className="aside-emoji">✈️</span>
            <span className="aside-emoji emoji-two">🌄</span>
            <span className="aside-emoji emoji-three">🧭</span>
            <div className="aside-sticker">GO<br />EXPLORE</div>
          </div>
          <div className="aside-copy">
            <div className="section-kicker">A GOOD TRIP STARTS HERE</div>
            <h3>More moments.<br />Fewer tabs open.</h3>
            <p>We're bringing the little decisions together, so you can focus on the experience.</p>
            <div className="aside-points">
              <span><Check size={15} /> A plan shaped around your budget</span>
              <span><Check size={15} /> Ideas grouped by day and place</span>
              <span><Check size={15} /> Options you can compare</span>
            </div>
          </div>
          <div className="aside-note">
            <ShieldCheck size={17} />
            <span>We clearly label estimates and sample data. No pretend live prices.</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
