import type {
  AuthResponse,
  ModifyTripRequest,
  ModifyTripResponse,
  SavedTripSummary,
  TripPlanResponse,
  TripRequest,
  User,
} from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

/* ─── API Key Management ─── */
export function getSavedApiKey(): string {
  try {
    return localStorage.getItem('tripwise_ai_key') || '';
  } catch {
    return '';
  }
}

export function saveApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem('tripwise_ai_key', key.trim());
    } else {
      localStorage.removeItem('tripwise_ai_key');
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/* ─── Auth Token & User Management ─── */
export function getAuthToken(): string {
  try {
    return localStorage.getItem('tripwise_auth_token') || '';
  } catch {
    return '';
  }
}

export function saveAuthToken(token: string): void {
  try {
    if (token.trim()) {
      localStorage.setItem('tripwise_auth_token', token.trim());
    } else {
      localStorage.removeItem('tripwise_auth_token');
    }
  } catch {}
}

export function getSavedUser(): User | null {
  try {
    const raw = localStorage.getItem('tripwise_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSavedUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem('tripwise_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tripwise_user');
    }
  } catch {}
}

export function logout(): void {
  saveAuthToken('');
  saveSavedUser(null);
}

/* ─── Google Auth API ─── */
export async function loginWithGoogle(params: {
  credential?: string;
  demo?: boolean;
  name?: string;
  email?: string;
  pictureUrl?: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = 'Google sign-in failed';
    try {
      const parsed = JSON.parse(raw);
      if (parsed.message) message = parsed.message;
    } catch {}
    throw new Error(message);
  }

  const data = (await response.json()) as AuthResponse;
  saveAuthToken(data.token);
  saveSavedUser(data.user);
  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      logout();
      return null;
    }
    const user = (await response.json()) as User;
    saveSavedUser(user);
    return user;
  } catch {
    return getSavedUser();
  }
}

/* ─── Trip Planning API ─── */
export async function planTrip(request: TripRequest): Promise<TripPlanResponse> {
  const apiKey = request.apiKey || getSavedApiKey();
  const payload = { ...request, apiKey: apiKey || undefined };

  const response = await fetch(`${API_BASE}/api/trips/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw || `Trip planning failed (${response.status})`;
    try {
      const parsed = JSON.parse(raw) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {}
    throw new Error(message);
  }
  return response.json() as Promise<TripPlanResponse>;
}

export async function modifyTrip(request: ModifyTripRequest): Promise<ModifyTripResponse> {
  const apiKey = request.apiKey || getSavedApiKey();
  const payload = { ...request, apiKey: apiKey || undefined };

  const response = await fetch(`${API_BASE}/api/trips/modify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw || `Trip customization failed (${response.status})`;
    try {
      const parsed = JSON.parse(raw) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {}
    throw new Error(message);
  }
  return response.json() as Promise<ModifyTripResponse>;
}

/* ─── Database Trip Persistence API ─── */
export async function saveTripToDb(plan: TripPlanResponse): Promise<SavedTripSummary> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Please sign in with Google to save your trip itinerary to your account.');
  }

  const response = await fetch(`${API_BASE}/api/user/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = 'Failed to save trip to database';
    try {
      const parsed = JSON.parse(raw);
      if (parsed.message) message = parsed.message;
    } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<SavedTripSummary>;
}

export async function listUserTrips(): Promise<SavedTripSummary[]> {
  const token = getAuthToken();
  if (!token) return [];

  const response = await fetch(`${API_BASE}/api/user/trips`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to load saved trips');
  }

  return response.json() as Promise<SavedTripSummary[]>;
}

export async function getSavedTripDetails(id: string): Promise<TripPlanResponse> {
  const token = getAuthToken();
  if (!token) throw new Error('Sign in required');

  const response = await fetch(`${API_BASE}/api/user/trips/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to load itinerary details');
  }

  return response.json() as Promise<TripPlanResponse>;
}

export async function deleteSavedTrip(id: string): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  const response = await fetch(`${API_BASE}/api/user/trips/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to delete saved trip');
  }
}
