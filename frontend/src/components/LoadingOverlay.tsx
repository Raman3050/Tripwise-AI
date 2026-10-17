import { useEffect, useState } from 'react';
import { Compass, MapPin, Hotel, Utensils, Route, Sparkles, Wallet } from 'lucide-react';

const steps = [
  { icon: <MapPin size={22} />, label: 'Finding your destination…', color: '#5b78f0' },
  { icon: <Route size={22} />, label: 'Mapping out routes…', color: '#4a9f86' },
  { icon: <Hotel size={22} />, label: 'Discovering places to stay…', color: '#e0885a' },
  { icon: <Utensils size={22} />, label: 'Picking the best restaurants…', color: '#c47bd4' },
  { icon: <Wallet size={22} />, label: 'Calculating costs…', color: '#daa54e' },
  { icon: <Sparkles size={22} />, label: 'Putting it all together…', color: '#5b78f0' },
];

export default function LoadingOverlay() {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((s) => (s + 1) % steps.length);
    }, 2200);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((d) => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(dotTimer);
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loading-card">
        {/* Animated orbs */}
        <div className="loading-orbs">
          <div className="loading-orb orb-1" />
          <div className="loading-orb orb-2" />
          <div className="loading-orb orb-3" />
        </div>

        {/* Central compass */}
        <div className="loading-compass">
          <Compass size={42} />
        </div>

        {/* Step progress */}
        <div className="loading-steps">
          {steps.map((step, i) => (
            <div key={i} className={`loading-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}>
              <span className="loading-step-icon" style={{ color: step.color }}>{step.icon}</span>
              <span className="loading-step-label">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Active message */}
        <div className="loading-active-message">
          <span style={{ color: steps[currentStep].color }}>{steps[currentStep].icon}</span>
          <span>{steps[currentStep].label}{dots}</span>
        </div>

        <p className="loading-subtext">Your AI travel planner is crafting something special</p>

        {/* Progress bar */}
        <div className="loading-progress">
          <div className="loading-progress-fill" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
