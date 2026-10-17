import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TripPlanResponse } from '../types';

/* ─── Custom marker icons ─── */
function svgIcon(color: string, glyph: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 4px;
      background:${color};display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:14px;font-weight:700;box-shadow:0 3px 12px rgba(0,0,0,.25);
      transform:rotate(-45deg);border:2px solid #fff;
    "><span style="transform:rotate(45deg);display:block">${glyph}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

const attractionIcon = svgIcon('#5b78f0', '★');
const hotelIcon = svgIcon('#4a9f86', '🏨');
const restaurantIcon = svgIcon('#e0885a', '🍽');

/* ─── Auto-fit bounds ─── */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (points.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(points.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 13 });
      fitted.current = true;
    }
  }, [points, map]);
  return null;
}

interface TripMapProps {
  plan: TripPlanResponse;
  activeDay: number;
}

export default function TripMap({ plan, activeDay }: TripMapProps) {
  const allPoints: [number, number][] = [];

  // Gather coordinates
  const addPoint = (lat?: number | null, lon?: number | null) => {
    if (lat != null && lon != null) allPoints.push([lat, lon]);
  };

  plan.attractions.forEach((p) => addPoint(p.latitude, p.longitude));
  plan.stays.forEach((p) => addPoint(p.latitude, p.longitude));
  plan.restaurants.forEach((p) => addPoint(p.latitude, p.longitude));

  if (allPoints.length === 0) return null;

  // Find active-day place IDs for highlighting
  const activeDayPlaceIds = new Set(
    plan.itinerary[activeDay]?.activities.map((a) => a.placeId) ?? []
  );

  // Build route polyline from active day's activities
  const routePoints: [number, number][] = [];
  if (plan.itinerary[activeDay]) {
    for (const activity of plan.itinerary[activeDay].activities) {
      const place = [...plan.attractions, ...plan.stays, ...plan.restaurants]
        .find((p) => p.id === activity.placeId);
      if (place?.latitude != null && place?.longitude != null) {
        routePoints.push([place.latitude, place.longitude]);
      }
    }
  }

  const center: [number, number] = allPoints.length > 0
    ? [allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length,
       allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length]
    : [20.5937, 78.9629];

  return (
    <div className="trip-map-wrapper">
      <MapContainer center={center} zoom={11} scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '16px' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FitBounds points={allPoints} />

        {/* Route polyline for active day */}
        {routePoints.length > 1 && (
          <Polyline positions={routePoints}
            pathOptions={{ color: '#5b78f0', weight: 3, opacity: 0.7, dashArray: '8 6' }} />
        )}

        {/* Attraction markers */}
        {plan.attractions.filter((p) => p.latitude != null && p.longitude != null).map((place) => (
          <Marker key={place.id} position={[place.latitude!, place.longitude!]}
            icon={attractionIcon}
            opacity={activeDayPlaceIds.size === 0 || activeDayPlaceIds.has(place.id) ? 1 : 0.4}>
            <Popup>
              <strong>{place.name}</strong><br />
              <small>{place.address}</small><br />
              {place.mapUrl && <a href={place.mapUrl} target="_blank" rel="noreferrer">Open in Maps ↗</a>}
            </Popup>
          </Marker>
        ))}

        {/* Hotel markers */}
        {plan.stays.filter((p) => p.latitude != null && p.longitude != null).map((place) => (
          <Marker key={place.id} position={[place.latitude!, place.longitude!]}
            icon={hotelIcon} opacity={0.85}>
            <Popup>
              <strong>{place.name}</strong><br />
              <small>{place.address}</small>
            </Popup>
          </Marker>
        ))}

        {/* Restaurant markers */}
        {plan.restaurants.filter((p) => p.latitude != null && p.longitude != null).map((place) => (
          <Marker key={place.id} position={[place.latitude!, place.longitude!]}
            icon={restaurantIcon} opacity={0.85}>
            <Popup>
              <strong>{place.name}</strong><br />
              <small>{place.address}</small>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <span><i style={{ background: '#5b78f0' }} /> Attractions</span>
        <span><i style={{ background: '#4a9f86' }} /> Hotels</span>
        <span><i style={{ background: '#e0885a' }} /> Restaurants</span>
      </div>
    </div>
  );
}
