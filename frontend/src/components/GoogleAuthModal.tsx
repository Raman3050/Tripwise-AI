import { useEffect, useState } from 'react';
import type { User } from '../types';
import { loginWithGoogle } from '../api';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function GoogleAuthModal({ isOpen, onClose, onSuccess }: GoogleAuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customClientId, setCustomClientId] = useState(
    localStorage.getItem('tripwise_google_client_id') ||
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      ''
  );
  const [showConfig, setShowConfig] = useState(false);

  // Initialize official Google Identity Services button if script & client ID are available
  useEffect(() => {
    if (!isOpen) return;

    const clientId = customClientId.trim();
    if (!clientId) return;

    const initGoogleGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              if (response.credential) {
                setLoading(true);
                setError('');
                try {
                  const res = await loginWithGoogle({ credential: response.credential });
                  onSuccess(res.user);
                  onClose();
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : 'Google authentication failed');
                } finally {
                  setLoading(false);
                }
              }
            },
          });

          const container = document.getElementById('gsi-button-container');
          if (container) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              width: 340,
              text: 'continue_with',
              shape: 'pill',
            });
          }
        } catch (e) {
          console.warn('Google GSI init failed:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGsi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleGsi;
      document.body.appendChild(script);
    }
  }, [isOpen, customClientId, onClose, onSuccess]);

  if (!isOpen) return null;

  const handleInstantDemoLogin = async (name: string, email: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await loginWithGoogle({
        demo: true,
        name,
        email,
      });
      onSuccess(res.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const saveClientId = (id: string) => {
    setCustomClientId(id);
    localStorage.setItem('tripwise_google_client_id', id.trim());
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-badge">🔐 Google Sign-In</span>
            <h3>Sign in to Tripwise AI</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="modal-desc">
          Sign in to save your customized itineraries, review past routes in your database, and access them anywhere.
        </p>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="auth-options-container">
          {/* Render Google official GSI button if client ID is configured */}
          {customClientId.trim() ? (
            <div className="google-official-btn-wrapper">
              <div id="gsi-button-container" />
              <div className="auth-divider">
                <span>OR FAST DEMO SIGN-IN</span>
              </div>
            </div>
          ) : null}

          {/* Instant 1-Click Google sign in for hackathon & development */}
          <button
            type="button"
            className="google-sign-in-btn"
            onClick={() => handleInstantDemoLogin('Raman Bajaj', 'raman@tripwise.ai')}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Signing in...' : 'Sign in as Raman Bajaj'}</span>
          </button>

          <button
            type="button"
            className="guest-sign-in-btn"
            onClick={() => handleInstantDemoLogin('Guest Traveler', 'guest@tripwise.ai')}
            disabled={loading}
          >
            <span>Continue as Guest Traveler</span>
          </button>
        </div>

        {/* Optional Google Client ID Config Toggle */}
        <div className="auth-config-toggle">
          <button
            type="button"
            className="text-link-button"
            onClick={() => setShowConfig(!showConfig)}
          >
            {showConfig ? 'Hide Google Cloud Client ID' : '⚙️ Configure custom Google Client ID'}
          </button>
          {showConfig && (
            <div className="client-id-box">
              <label htmlFor="client-id-input">Google Cloud OAuth Client ID:</label>
              <input
                id="client-id-input"
                type="text"
                placeholder="xxxx.apps.googleusercontent.com"
                value={customClientId}
                onChange={(e) => saveClientId(e.target.value)}
              />
              <small>
                From Google Cloud Console &rarr; APIs & Services &rarr; Credentials &rarr; OAuth 2.0 Client IDs.
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
