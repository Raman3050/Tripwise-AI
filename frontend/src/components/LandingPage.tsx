import type { ReactNode } from 'react';
import {
  ArrowRight, ArrowUpRight, Compass, MapPin, Mountain, Route,
  Sparkles, Wallet,
} from 'lucide-react';

interface LandingPageProps {
  onStartPlanning: () => void;
}

export default function LandingPage({ onStartPlanning }: LandingPageProps) {
  return (
    <main>
      {/* ─── Hero ─── */}
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL AI TRAVEL PLANNER</div>
          <h1>Less planning.<br /><span>More <em>living.</em></span></h1>
          <p className="hero-description">
            A trip that feels like you. Tell us where you want to go, and let your AI travel companion
            bring the routes, stays, experiences and budget together.
          </p>
          <div className="hero-actions">
            <button className="button button-primary button-large" onClick={onStartPlanning}>
              Let's plan your trip <ArrowRight size={18} />
            </button>
            <span className="micro-proof">
              <span className="avatar-stack"><i>R</i><i>A</i><i>M</i></span>
              Made for curious travelers
            </span>
          </div>
          <div className="hero-stats">
            <div><strong>One plan</strong><span>All the moving parts</span></div>
            <div><strong>Built around you</strong><span>Your pace, your budget</span></div>
            <div><strong>Know before you go</strong><span>Clear cost estimates</span></div>
          </div>
        </div>
        <div className="hero-art" aria-label="Illustration of a planned mountain trip">
          <div className="art-sun" />
          <div className="art-cloud cloud-one" />
          <div className="art-cloud cloud-two" />
          <div className="mountain-back" />
          <div className="mountain-front" />
          <div className="art-water" />
          <div className="art-path" />
          <div className="floating-tag tag-top">
            <span className="tag-icon"><MapPin size={15} /></span>
            <span><b>Your next memory</b><small>Waiting to happen</small></span>
          </div>
          <div className="floating-tag tag-bottom">
            <span className="tag-icon tag-green"><Wallet size={16} /></span>
            <span><b>Budget-aware planning</b><small>More trip, less guesswork</small></span>
          </div>
          <div className="art-stamp"><Compass size={22} /><span>WANDER<br />WELL</span></div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="steps-strip">
        <div className="section-kicker">YOUR NEXT ADVENTURE, IN THREE STEPS</div>
        <div className="steps-grid">
          <StepItem number="01" icon={<MapPin />} title="Set the scene" text="Pick your destination, dates, group and budget." />
          <StepItem number="02" icon={<Sparkles />} title="Let AI connect the dots" text="Turn your preferences into a practical daily plan." />
          <StepItem number="03" icon={<Route />} title="Go with a plan" text="Compare options, check costs and explore booking links." />
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="feature-section">
        <div className="feature-heading">
          <div>
            <div className="section-kicker">A BETTER WAY TO GET THERE</div>
            <h2>The details, thoughtfully handled.</h2>
          </div>
          <p>Not just places to visit. A connected plan that works around your time, your interests and what you want to spend.</p>
        </div>
        <div className="feature-cards">
          <FeatureCard icon={<Route />} title="Routes that make sense" text="Keep nearby places together and avoid spending your whole day in transit." />
          <FeatureCard icon={<span className="lucide-icon">₹</span>} title="A budget you can understand" text="See the group total, cost per traveler and where the money goes." />
          <FeatureCard icon={<span className="lucide-icon">♥</span>} title="Your kind of trip" text="Culture, food, nature or a little of everything — shape the plan around you." />
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="cta-band">
        <div>
          <div className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</div>
          <h2>The world is calling.<br />Let's make a plan.</h2>
        </div>
        <button className="button button-light button-large" onClick={onStartPlanning}>
          Start planning <ArrowRight size={18} />
        </button>
        <div className="cta-doodle"><Mountain size={68} /></div>
      </section>
    </main>
  );
}

function StepItem({ number, icon, title, text }: { number: string; icon: ReactNode; title: string; text: string }) {
  return (
    <div className="step-item">
      <div className="step-number">{number}</div>
      <div className="step-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="feature-card">
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <span className="feature-arrow"><ArrowUpRight size={17} /></span>
    </div>
  );
}
