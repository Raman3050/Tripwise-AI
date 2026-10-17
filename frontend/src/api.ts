import type { TripPlanResponse, TripRequest } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

export async function planTrip(request: TripRequest): Promise<TripPlanResponse> {
  const response = await fetch(`${API_BASE}/api/trips/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const raw = await response.text();
    let message = raw || `Trip planning failed (${response.status})`;
    try {
      const parsed = JSON.parse(raw) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      // Keep the original response text when it is not JSON.
    }
    throw new Error(message);
  }
  return response.json() as Promise<TripPlanResponse>;
}
