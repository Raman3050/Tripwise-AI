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
- Explicit `LIVE_DATA` / `DEMO_DATA` and `GROQ_AI` / `RULE_BASED` labels.
- **Google Sign-In & Authentication**: Official Google Identity Services + instant 1-click demo login for fast hackathon presentation.
- **Persistent Database Storage**: Spring Data JPA + H2 file database (`./data/tripwisedb`) storing complete itinerary snapshots by user and route.
- **Interactive AI Trip Copilot**: Natural-language conversational assistant allowing users to cut budgets, customize stops, reorder places, and switch travel modes on the fly.
- **Free Interactive Route Map**: Powered by Leaflet + OpenStreetMap with zero mandatory API key requirements.
- **Export & Share**: Multi-page PDF generation via jsPDF + autoTable and calendar export (`.ics`).

## Requirements

- Java 21+
- Node.js 20.19+ or 22.12+
- Maven (included `./mvnw`)
- A Geoapify key (optional, for live place data)
- A Groq key (optional, for LLM itinerary generation)
- A Google Cloud OAuth Client ID (optional, for official Google login)

## Start backend

From `backend/`:

```bash
# macOS/Linux
export GEOAPIFY_API_KEY="your_key_here"  # optional
export GROQ_API_KEY="your_key_here"      # optional
export GOOGLE_CLIENT_ID="your_client_id" # optional
./mvnw spring-boot:run
```

PowerShell:

```powershell
$env:GEOAPIFY_API_KEY="your_key_here"
$env:GROQ_API_KEY="your_key_here"
$env:GOOGLE_CLIENT_ID="your_client_id"
.\mvnw.cmd spring-boot:run
```

Backend runs on http://localhost:8080.
H2 Database Console is accessible at http://localhost:8080/h2-console (`jdbc:h2:file:./data/tripwisedb`).

## Start frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Frontend runs on http://localhost:5173.

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/trips/plan` | Generate AI/rule-based trip plan |
| `POST` | `/api/trips/modify` | Interactive Trip Copilot plan updates |
| `POST` | `/api/auth/google` | Google OAuth token verification & session creation |
| `GET` | `/api/auth/me` | Fetch currently authenticated user |
| `POST` | `/api/user/trips` | Save trip itinerary to user database |
| `GET` | `/api/user/trips` | List all saved itineraries for authenticated user |
| `GET` | `/api/user/trips/{id}` | Get full saved itinerary snapshot |
| `DELETE` | `/api/user/trips/{id}` | Delete saved itinerary from database |
| `GET` | `/api/health` | Healthcheck and active configuration status |

4. Replace the estimate model with configurable, explainable cost formulas and capture assumptions per trip.
5. Add itinerary edit/re-plan endpoint, authentication, tests and deployment.

## Project structure

```text
tripwise-ai-mvp/
├── frontend/     React + TypeScript + Vite
└── backend/      Java 21 + Spring Boot REST API
```
