# Tripwise AI — React + Spring Boot MVP

A full-stack starter for an AI-powered trip planner. It is deliberately designed to work **before partner-only travel APIs are approved**.

## What works in this starter

- A 3-step trip wizard: destination, origin, dates, travelers, budget and travel style.
- Spring Boot REST API: `POST /api/trips/plan` and `GET /api/health`.
- Geoapify integration for geocoding, points of interest, hotels/restaurants as place listings, and driving-route distance/time when `GEOAPIFY_API_KEY` is configured.
- Optional Groq AI itinerary drafting through its OpenAI-compatible chat-completions API when `GROQ_API_KEY` is configured.
- Rule-based itinerary generation if the AI API is not configured or fails.
- Cost breakdown calculated by Java, not by the LLM.
- Search/booking handoff links for Google Flights, IRCTC, redBus, Google Hotels/search and Google Maps.
- Explicit `LIVE_DATA` / `DEMO_DATA` and `GROQ_AI` / `RULE_BASED` labels. Price estimates are not represented as live fares.

## Important data limitations

Without Booking.com/Skyscanner access, this project does **not** have live hotel room rates/availability or live flight/rail/bus fares. Geoapify provides place/location information, not bookable travel inventory. External links open a provider/search destination; they do not guarantee a fare, seat, room, or availability. Demo places and all heuristic transport prices are marked as demo/estimates.

Geoapify documents a free plan with up to 3,000 credits/day. Limits and attribution requirements apply: https://www.geoapify.com/pricing/ and https://apidocs.geoapify.com/docs/places/.

Groq is optional. Check currently available models in your Groq console; the configured default is `openai/gpt-oss-120b`. Model availability and rate limits can change: https://console.groq.com/docs/models.

## Requirements

- Java 21+
- Network access on first Maven Wrapper run (the project uses Spring Boot 3.5.16)
- Node.js 20.19+ or 22.12+
- A Geoapify key (optional, for live location data)
- A Groq key (optional, for AI-written itineraries)

## Start backend

From `backend/`:

```bash
# macOS/Linux
export GEOAPIFY_API_KEY="your_key_here"  # optional
export GROQ_API_KEY="your_key_here"      # optional
export GROQ_MODEL="openai/gpt-oss-120b"  # optional
is
```

PowerShell:

```powershell
$env:GEOAPIFY_API_KEY="your_key_here"
$env:GROQ_API_KEY="your_key_here"
$env:GROQ_MODEL="openai/gpt-oss-120b"
.\mvnw.cmd spring-boot:run
```

Backend runs on http://localhost:8080.

## Start frontend

From `frontend/`:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the URL printed by Vite, usually http://localhost:5173.

## API request example

```bash
curl -X POST http://localhost:8080/api/trips/plan \
  -H 'Content-Type: application/json' \
  -d '{
    "origin":"Delhi, India",
    "destination":"Jaipur, India",
    "startDate":"2026-11-15",
    "endDate":"2026-11-18",
    "travelers":2,
    "budgetInr":30000,
    "travelStyle":"balanced",
    "preferredTransport":"cheapest",
    "interests":["culture","food","photography"]
  }'
```

## API configuration

| Variable           | Purpose                                 | Required                                          |
| ------------------ | --------------------------------------- | ------------------------------------------------- |
| `GEOAPIFY_API_KEY` | Geocoding, POIs and route distance/time | No; demo fixtures are used if absent/failing      |
| `GROQ_API_KEY`     | Optional AI itinerary draft             | No; rule-based planning is used if absent/failing |
| `GROQ_MODEL`       | Groq model ID                           | No; defaults to `openai/gpt-oss-120b`             |
| `FRONTEND_ORIGIN`  | CORS origin                             | No; defaults to `http://localhost:5173`           |

No API keys belong in React environment variables. The frontend talks to your Spring Boot backend; keys stay server-side.

## Next implementation milestones

1. Add persistence for saved trips (PostgreSQL + Spring Data JPA).
2. Add real flight search only if you obtain a provider with usable API access; Duffel test mode may use synthetic/sandbox offers and must be labelled accordingly.
3. Request access to a lodging/attractions API or use search handoffs until then.
4. Replace the estimate model with configurable, explainable cost formulas and capture assumptions per trip.
5. Add itinerary edit/re-plan endpoint, authentication, tests and deployment.

## Project structure

```text
tripwise-ai-mvp/
├── frontend/     React + TypeScript + Vite
└── backend/      Java 21 + Spring Boot REST API
```
