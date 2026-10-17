import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Bus, CalendarDays, CarFront,
  ChevronRight, CircleDollarSign, CircleHelp, Clock3, Download,
  ExternalLink, FileText, Heart, Hotel, MapPin, Mountain, Plane,
  RefreshCw, Route, Share2, SlidersHorizontal, Sparkles, TrainFront,
  Users, Utensils, Wallet, Calendar,
} from 'lucide-react';
import type { TripPlanResponse, TransportOption, PlaceCard } from '../types';
import TripMap from './TripMap';
import { exportTripPDF, exportCalendarICS, generateShareUrl } from '../utils/exportUtils';

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

interface ResultsPageProps {
  plan: TripPlanResponse;
  onEditTrip: () => void;
  onNewTrip: () => void;
}

export default function ResultsPage({ plan, onEditTrip, onNewTrip }: ResultsPageProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [saved, setSaved] = useState(false);
  const [shareTooltip, setShareTooltip] = useState(false);

  const handleShare = () => {
    const url = generateShareUrl(plan);
    navigator.clipboard.writeText(url).then(() => {
      setShareTooltip(true);
      setTimeout(() => setShareTooltip(false), 2500);
    });
  };

  return (
    <main className="results-page">
      {/* ─── Top bar ─── */}
      <div className="results-topline">
        <button className="text-button" onClick={onEditTrip}>
          <ArrowLeft size={16} /> Edit trip details
        </button>
        <div className="result-status">
          <span className={`status-dot ${plan.dataMode === 'LIVE_DATA' ? 'live' : ''}`} />
          {plan.dataMode === 'LIVE_DATA' ? 'Live place data connected' : 'Demo place data'}
          <span className="status-divider">·</span>
          {plan.aiMode === 'GROQ_AI' ? 'AI itinerary' : 'Smart itinerary'}
        </div>
      </div>

      {/* ─── Hero ─── */}
      <section className="results-hero">
        <div className="results-hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> YOUR TRIP IS TAKING SHAPE</div>
          <h1>{plan.trip.destination.split(',')[0]}<span> awaits.</span></h1>
          <p>{plan.summary}</p>
          <div className="trip-meta">
            <span><CalendarDays size={16} />{dateLabel(plan.trip.startDate)} – {dateLabel(plan.trip.endDate)}</span>
            <span><Users size={16} />{plan.trip.travelers} travelers</span>
            <span><Clock3 size={16} />{plan.itinerary.length} {plan.itinerary.length === 1 ? 'day' : 'days'}</span>
          </div>
          <div className="results-hero-actions">
            <a className="button button-light" href={plan.mapUrl} target="_blank" rel="noreferrer">
              Open route map <ArrowUpRight size={16} />
            </a>
            <button className={`button ${saved ? 'button-saved' : 'button-outline-light'}`}
              onClick={() => setSaved((s) => !s)}>
              <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Saved for later' : 'Save this trip'}
            </button>
          </div>
        </div>
        <div className="results-hero-graphic">
          <div className="hero-graphic-sun" />
          <div className="hero-graphic-mountain m1" />
          <div className="hero-graphic-mountain m2" />
          <div className="hero-graphic-water" />
          <div className="graphic-pin pin-one"><MapPin size={19} /></div>
          <div className="graphic-pin pin-two"><MapPin size={19} /></div>
          <div className="graphic-route" />
          <div className="graphic-caption">
            <span>YOUR ROUTE</span>
            <b>{plan.trip.origin.split(',')[0]} <ArrowRight size={13} /> {plan.trip.destination.split(',')[0]}</b>
          </div>
        </div>
      </section>

      {/* ─── Export & Share Bar ─── */}
      <section className="export-bar">
        <div className="export-bar-label">
          <FileText size={16} />
          <span>Take your plan with you</span>
        </div>
        <div className="export-bar-actions">
          <button className="button button-outline button-small" onClick={() => exportTripPDF(plan)}>
            <Download size={14} /> Download PDF
          </button>
          <button className="button button-outline button-small" onClick={() => exportCalendarICS(plan)}>
            <Calendar size={14} /> Export to Calendar
          </button>
          <div className="share-button-wrap">
            <button className="button button-outline button-small" onClick={handleShare}>
              <Share2 size={14} /> Share Trip
            </button>
            {shareTooltip && <span className="share-tooltip">Link copied!</span>}
          </div>
        </div>
      </section>

      {/* ─── Notices ─── */}
      <div className="data-notices">
        {plan.notices.map((notice, i) => (
          <div key={i} className="notice-line"><CircleHelp size={15} />{notice}</div>
        ))}
      </div>

      {/* ─── Cost Overview ─── */}
      <section className="cost-overview">
        <div className="cost-main-card">
          <div className="cost-card-label">
            <span>ESTIMATED TOTAL TRIP COST</span>
            <span className="estimate-chip">ESTIMATE</span>
          </div>
          <div className="big-amount">{money(plan.costEstimate.totalInr)}</div>
          <div className="cost-per-person"><Users size={15} /> {money(plan.costEstimate.perPersonInr)} per person</div>
          <div className="budget-meter">
            <div className="budget-meter-fill"
              style={{ width: `${Math.min(100, Math.round(plan.costEstimate.totalInr / Math.max(1, plan.trip.budgetInr) * 100))}%` }} />
          </div>
          <div className="budget-meter-labels">
            <span>Estimated spend</span>
            <span>Budget {money(plan.trip.budgetInr)}</span>
          </div>
        </div>
        <div className="cost-breakdown-card">
          <div className="card-section-heading">
            <div>
              <div className="section-kicker">THE BREAKDOWN</div>
              <h3>Where it goes</h3>
            </div>
            <CircleDollarSign size={21} />
          </div>
          <CostRow label="Transport" amount={plan.costEstimate.transportCostInr} icon={<Plane size={16} />} />
          <CostRow label="Accommodation" amount={plan.costEstimate.accommodationCostInr} icon={<Hotel size={16} />} />
          <CostRow label="Food & dining" amount={plan.costEstimate.foodCostInr} icon={<Utensils size={16} />} />
          <CostRow label="Local transport" amount={plan.costEstimate.localTransportCostInr} icon={<CarFront size={16} />} />
          <CostRow label="Activities" amount={plan.costEstimate.activitiesCostInr} icon={<Sparkles size={16} />} />
          <CostRow label="Contingency" amount={plan.costEstimate.contingencyInr} icon={<Wallet size={16} />} />
          <p className="small-note">{plan.costEstimate.note}</p>
        </div>
      </section>

      {/* ─── Interactive Map ─── */}
      <section className="content-section map-section">
        <SectionHeader eyebrow="SEE YOUR JOURNEY" title="Interactive trip map"
          description="Explore your stops on the map. Click a day to highlight its route." />
        <TripMap plan={plan} activeDay={activeDay} />
      </section>

      {/* ─── Transport ─── */}
      <section className="content-section transport-section">
        <SectionHeader eyebrow="GETTING THERE" title="Choose your way"
          description="Compare indicative costs and travel times, then check current availability with the provider." />
        <div className="transport-grid">
          {plan.transportOptions.map((option) => (
            <TransportCard key={option.id} option={option} />
          ))}
        </div>
      </section>

      {/* ─── Itinerary ─── */}
      <section className="content-section itinerary-section">
        <SectionHeader eyebrow="YOUR DAYS, WELL SPENT" title="The itinerary"
          description="A flexible rhythm for each day. Check opening hours and travel time before setting off." />
        <div className="itinerary-layout">
          <div className="day-selector">
            {plan.itinerary.map((day, i) => (
              <button key={day.dayNumber} className={`day-tab ${activeDay === i ? 'active' : ''}`}
                onClick={() => setActiveDay(i)}>
                <span>DAY {String(day.dayNumber).padStart(2, '0')}</span>
                <b>{dateLabel(day.date)}</b>
                <small>{day.title}</small>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
          <div className="day-detail">
            {plan.itinerary[activeDay] && (
              <>
                <div className="day-detail-head">
                  <div>
                    <span className="day-number-chip">DAY {String(plan.itinerary[activeDay].dayNumber).padStart(2, '0')}</span>
                    <h3>{plan.itinerary[activeDay].title}</h3>
                    <p>{plan.itinerary[activeDay].narrative}</p>
                  </div>
                  <span className="day-date-badge"><CalendarDays size={14} />{dateLabel(plan.itinerary[activeDay].date)}</span>
                </div>
                <div className="timeline">
                  {plan.itinerary[activeDay].activities.map((activity, i) => (
                    <div className="timeline-item" key={`${activity.placeId}-${i}`}>
                      <div className="timeline-time">{activity.startTime}</div>
                      <div className="timeline-rail">
                        <span className="timeline-dot" />
                        {i < plan.itinerary[activeDay].activities.length - 1 && <span className="timeline-stem" />}
                      </div>
                      <div className="timeline-content">
                        <h4>{activity.placeName}</h4>
                        <p>{activity.description}</p>
                        <div className="timeline-meta">
                          <span><Clock3 size={13} />{activity.durationMinutes} min</span>
                          <span><Route size={13} />{activity.travelNote}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="day-flex-note">
                  <Sparkles size={15} />
                  <span>Keep this day flexible. Local opening hours, traffic and weather can change the best order.</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Places ─── */}
      <section className="content-section places-section">
        <SectionHeader eyebrow="STAY CLOSE TO THE GOOD STUFF" title="Places worth a look"
          description="Place recommendations are separate from live room availability. Use the links to check details and book." />
        <div className="place-groups">
          <PlaceGroup title="Places to stay" subtitle="Accommodation listings" icon={<Hotel size={19} />}
            places={plan.stays} emptyText="No accommodation places returned. Try a broader destination search." />
          <PlaceGroup title="Good food nearby" subtitle="Restaurants & cafes" icon={<Utensils size={19} />}
            places={plan.restaurants} emptyText="No restaurant places returned." />
          <PlaceGroup title="Things to explore" subtitle="Sights & experiences" icon={<Mountain size={19} />}
            places={plan.attractions} emptyText="No attractions returned. Your plan will still include a suggested daily rhythm." />
        </div>
      </section>

      {/* ─── Booking Links ─── */}
      <section className="content-section booking-section">
        <SectionHeader eyebrow="NEXT STEP: MAKE IT YOURS" title="Check availability & book"
          description="These are provider/search handoffs, not confirmed tickets or reservations." />
        <div className="booking-grid">
          {plan.bookingLinks.map((link) => (
            <a className="booking-link-card" key={link.category} href={link.url} target="_blank" rel="noreferrer">
              <span className="booking-icon">
                {link.category === 'FLIGHT' ? <Plane /> : link.category === 'TRAIN' ? <TrainFront /> :
                  link.category === 'BUS' ? <Bus /> : link.category === 'HOTEL' ? <Hotel /> :
                    link.category === 'MAP' ? <MapPin /> : <ExternalLink />}
              </span>
              <span className="booking-link-copy">
                <b>{link.title}</b><small>{link.description}</small>
              </span>
              <ArrowUpRight size={17} />
            </a>
          ))}
        </div>
      </section>

      {/* ─── Re-plan ─── */}
      <section className="replan-banner">
        <div className="replan-orb"><Sparkles size={28} /></div>
        <div>
          <div className="section-kicker">THE PLAN IS YOURS TO CHANGE</div>
          <h3>Want to take it in a different direction?</h3>
          <p>Try a different budget, travel pace or set of interests. Your plan will update around those choices.</p>
        </div>
        <button className="button button-dark" onClick={onEditTrip}>
          Adjust trip <SlidersHorizontal size={16} />
        </button>
      </section>

      {/* ─── Footer ─── */}
      <footer className="results-footer">
        <span>Made with curiosity by Tripwise AI</span>
        <button className="text-button" onClick={onNewTrip}>
          Plan another trip <RefreshCw size={14} />
        </button>
      </footer>
    </main>
  );
}

/* ─── Sub-components ─── */
function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="section-heading">
      <div><div className="section-kicker">{eyebrow}</div><h2>{title}</h2></div>
      <p>{description}</p>
    </div>
  );
}

function CostRow({ label, amount, icon }: { label: string; amount: number; icon: React.ReactNode }) {
  return (
    <div className="cost-row">
      <span className="cost-row-icon">{icon}</span>
      <span>{label}</span>
      <b>{money(amount)}</b>
    </div>
  );
}

function TransportCard({ option }: { option: TransportOption }) {
  const icon = option.id === 'flight' ? <Plane /> : option.id === 'train' ? <TrainFront /> :
    option.id === 'bus' ? <Bus /> : <CarFront />;
  return (
    <article className={`transport-card ${option.recommended ? 'recommended' : ''}`}>
      <div className="transport-card-top">
        <span className="transport-mode-icon">{icon}</span>
        {option.recommended && <span className="recommended-badge"><Sparkles size={12} /> Suggested</span>}
      </div>
      <h3>{option.name}</h3>
      <p>{option.description}</p>
      <div className="transport-time"><Clock3 size={15} />{option.durationLabel}</div>
      <div className="transport-price">
        <strong>{money(option.totalCostInr)}</strong><span>group estimate</span>
      </div>
      <div className="transport-per-person">{money(option.perPersonCostInr)} per person · {option.pricingLabel}</div>
      <a className="button button-outline button-full" href={option.bookingUrl} target="_blank" rel="noreferrer">
        Check options <ArrowUpRight size={15} />
      </a>
    </article>
  );
}

function PlaceGroup({ title, subtitle, icon, places, emptyText }: {
  title: string; subtitle: string; icon: React.ReactNode; places: PlaceCard[]; emptyText: string;
}) {
  return (
    <div className="place-group">
      <div className="place-group-heading">
        <span>{icon}</span>
        <div><h3>{title}</h3><p>{subtitle}</p></div>
      </div>
      {places.length ? (
        <div className="place-list">
          {places.slice(0, 4).map((place) => (
            <a className="place-card" key={place.id} href={place.mapUrl} target="_blank" rel="noreferrer">
              <div className={`place-thumb thumb-${place.category.toLowerCase()}`}><MapPin size={20} /></div>
              <div className="place-info">
                <b>{place.name}</b>
                <small>{place.address || 'Location details available via map'}</small>
                <span>{place.verified ? 'Place data retrieved' : 'Sample recommendation'}{place.openingHours ? ` · ${place.openingHours}` : ''}</span>
              </div>
              <ArrowUpRight size={15} />
            </a>
          ))}
        </div>
      ) : (
        <p className="empty-places">{emptyText}</p>
      )}
    </div>
  );
}
