# API access and truthful-data policy

## Geoapify (implemented)

1. Create a project at https://myprojects.geoapify.com/.
2. Copy its API key.
3. Export `GEOAPIFY_API_KEY` before starting Spring Boot.
4. The backend calls geocoding, Places and Routing endpoints from the server, so the key is not exposed to the browser.
5. Keep within your plan's quotas and provide required Geoapify/data-source attribution. The current published free plan describes 3,000 credits per day: https://www.geoapify.com/pricing/.

## Groq (implemented as optional AI)

1. Create a developer account and key at https://console.groq.com/keys.
2. Export `GROQ_API_KEY` before starting Spring Boot.
3. `GROQ_MODEL` defaults to `openai/gpt-oss-120b`. Check the live model catalogue and your account limits: https://console.groq.com/docs/models.
4. If Groq is unconfigured, rate-limited or returns an invalid itinerary, the API falls back to the rule-based planner.

## Flights (no partner key currently configured)

- The UI links to Google Flights for a live user-side search.
- Spring Boot shows a clearly labelled heuristic price estimate. This is not sourced from airline inventory and should not be described as live.
- Duffel test mode is a future integration candidate: https://duffel.com/docs/api/overview/test-mode. Duffel documents a `Duffel Airways` sandbox, but explicitly notes its schedules and prices are not realistic. It should be shown only as test data and does not replace live production offers. A test token is not a live booking credential.
- Do not add fake airline/operator availability or invent a direct-booking URL for an estimate.

## Hotels and attractions (no partner key currently configured)

- Geoapify place data can help discover hotels, restaurants and attractions, but it does not prove date-specific hotel inventory, nightly rates, timed-entry ticket availability or booking confirmation.
- Until a suitable partner API is enabled, the links take the traveler to a search/provider page. Accommodation and activity lines in the budget are assumptions, not supplier quotations.

## India rail and buses

- IRCTC and redBus are provided as outbound destinations, not API integrations.
- No unofficial endpoint or scraped inventory should be presented as an official live-fare integration. Add an authorized provider only after its terms and credentials are confirmed.

## Data labels in the app

- `LIVE_DATA`: the place provider returned results for all three place categories in the current request.
- `MIXED_DATA`: one or more place categories are live; missing categories use sample fixtures.
- `DEMO_DATA`: sample places are used.
- `GROQ_AI`: itinerary text came from the configured LLM and was validated against returned place IDs.
- `RULE_BASED`: an application-controlled itinerary was generated.

These labels describe the source of itinerary/place data only; transport prices and trip totals remain estimates unless a future authorized inventory integration explicitly says otherwise.
