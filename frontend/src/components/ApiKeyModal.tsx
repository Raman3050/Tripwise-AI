import { useState, type FormEvent } from 'react';
import { getSavedApiKey, saveApiKey } from '../api';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }: ApiKeyModalProps) {
  const [key, setKey] = useState(getSavedApiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    saveApiKey(key);
    onKeySaved(key);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-badge">✨ AI Settings</span>
            <h3>Connect Groq AI Model</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="modal-desc">
          Tripwise AI uses <strong>Groq Cloud</strong> (Llama 3.3 70B / Mixtral) to dynamically curate customized itineraries, realistic timings, and power the interactive Trip Copilot.
        </p>

        <form onSubmit={handleSave} className="api-key-form">
          <label htmlFor="groq-key-input" className="form-label">
            Groq API Key (starts with <code>gsk_...</code>)
          </label>
          <input
            id="groq-key-input"
            type="password"
            className="api-key-input"
            placeholder="gsk_..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
          />

          <div className="api-key-info-box">
            <div className="info-icon">💡</div>
            <div className="info-text">
              Don't have a key? Get one in seconds for free at{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                console.groq.com/keys ↗
              </a>
              . Even without a key, Tripwise AI uses built-in smart knowledge & Copilot rules.
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setKey('');
                saveApiKey('');
                onKeySaved('');
                onClose();
              }}
            >
              Clear Key
            </button>
            <button type="submit" className="btn btn-primary">
              {savedSuccess ? 'Saved ✓' : 'Save & Activate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
