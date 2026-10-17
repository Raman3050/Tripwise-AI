import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Trash2, Users, Wallet, ArrowRight } from 'lucide-react';
import type { SavedTripSummary, TripPlanResponse, User } from '../types';
import { deleteSavedTrip, getSavedTripDetails, listUserTrips } from '../api';

interface SavedTripsModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSelectTrip: (plan: TripPlanResponse) => void;
}

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const dateLabel = (value: string) => {
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return value;
  }
};

export default function SavedTripsModal({ isOpen, user, onClose, onSelectTrip }: SavedTripsModalProps) {
  const [trips, setTrips] = useState<SavedTripSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTripId, setLoadingTripId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadTrips = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await listUserTrips();
      setTrips(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not fetch saved trips from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTrips();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSelect = async (tripId: string) => {
    setLoadingTripId(tripId);
    setError('');
    try {
      const plan = await getSavedTripDetails(tripId);
      onSelectTrip(plan);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load saved trip');
    } finally {
      setLoadingTripId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved trip from the database?')) return;
    try {
      await deleteSavedTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete trip');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card saved-trips-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-badge">🗄 Database Storage</span>
            <h3>My Saved Itineraries</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {user && (
          <div className="user-profile-strip">
            <div className="user-avatar-small">
              {user.pictureUrl ? (
                <img src={user.pictureUrl} alt={user.name} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="user-meta-info">
              <b>{user.name}</b>
              <small>{user.email}</small>
            </div>
            <span className="db-connected-pill">H2 Database Connected</span>
          </div>
        )}

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="saved-trips-list-container">
          {loading && (
            <div className="saved-trips-loading">
              <div className="loading-spinner-small" />
              <span>Fetching your itineraries from database...</span>
            </div>
          )}

          {!loading && trips.length === 0 && (
            <div className="saved-trips-empty">
              <MapPin size={36} color="#94a3b8" />
              <h4>No saved itineraries yet</h4>
              <p>Generate a trip itinerary and click "Save this trip" to persist it in the database.</p>
            </div>
          )}

          {!loading &&
            trips.map((trip) => (
              <div
                key={trip.id}
                className="saved-trip-item"
                onClick={() => handleSelect(trip.id)}
              >
                <div className="saved-trip-item-top">
                  <div className="saved-trip-route">
                    <span>{trip.origin}</span>
                    <ArrowRight size={14} className="route-arrow" />
                    <b>{trip.destination}</b>
                  </div>
                  <button
                    type="button"
                    className="delete-trip-btn"
                    title="Delete saved trip"
                    onClick={(e) => handleDelete(e, trip.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="saved-trip-badges">
                  <span>
                    <CalendarDays size={13} /> {dateLabel(trip.startDate)} - {dateLabel(trip.endDate)}
                  </span>
                  <span>
                    <Users size={13} /> {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
                  </span>
                  <span>
                    <Wallet size={13} /> Spend: {money(trip.totalCostInr)}
                  </span>
                </div>

                {trip.summary && <p className="saved-trip-summary">{trip.summary}</p>}

                <div className="saved-trip-footer">
                  <span className="saved-timestamp">
                    Saved on {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <button
                    type="button"
                    className="load-trip-link"
                    disabled={loadingTripId === trip.id}
                  >
                    {loadingTripId === trip.id ? 'Opening...' : 'View Itinerary ↗'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
