export type TripRequest = {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budgetInr: number;
  travelStyle: 'budget' | 'balanced' | 'comfort';
  preferredTransport: 'cheapest' | 'fastest' | 'train' | 'bus' | 'flight' | 'car';
  interests: string[];
};

export type PlaceCard = {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: string | null;
  website?: string | null;
  mapUrl: string;
  dataSource: string;
  verified: boolean;
};

export type TransportOption = {
  id: string;
  name: string;
  description: string;
  durationLabel: string;
  totalCostInr: number;
  perPersonCostInr: number;
  pricingLabel: string;
  bookingUrl: string;
  recommended: boolean;
};

export type ItineraryActivity = {
  startTime: string;
  placeId: string;
  placeName: string;
  description: string;
  durationMinutes: number;
  travelNote: string;
};

export type TripDay = {
  dayNumber: number;
  date: string;
  title: string;
  narrative: string;
  activities: ItineraryActivity[];
};

export type CostEstimate = {
  currency: string;
  transportMode: string;
  transportCostInr: number;
  accommodationCostInr: number;
  foodCostInr: number;
  localTransportCostInr: number;
  activitiesCostInr: number;
  contingencyInr: number;
  totalInr: number;
  perPersonInr: number;
  note: string;
};

export type BookingLink = {
  title: string;
  description: string;
  url: string;
  category: string;
};

export type TripPlanResponse = {
  tripId: string;
  status: string;
  dataMode: 'LIVE_DATA' | 'DEMO_DATA' | string;
  aiMode: 'GROQ_AI' | 'RULE_BASED' | string;
  trip: TripRequest;
  summary: string;
  destinationNote: string;
  transportOptions: TransportOption[];
  itinerary: TripDay[];
  stays: PlaceCard[];
  restaurants: PlaceCard[];
  attractions: PlaceCard[];
  costEstimate: CostEstimate;
  bookingLinks: BookingLink[];
  notices: string[];
  mapUrl: string;
};
