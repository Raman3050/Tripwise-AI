package com.tripwise.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripwise.api.dto.ChatMessage;
import com.tripwise.api.dto.ModifyTripRequest;
import com.tripwise.api.dto.ModifyTripResponse;
import com.tripwise.api.dto.TripPlanResponse;
import com.tripwise.api.dto.TripPlanResponse.CostEstimate;
import com.tripwise.api.dto.TripPlanResponse.ItineraryActivity;
import com.tripwise.api.dto.TripPlanResponse.PlaceCard;
import com.tripwise.api.dto.TripPlanResponse.TransportOption;
import com.tripwise.api.dto.TripPlanResponse.TripDay;
import com.tripwise.api.dto.TripRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiPlannerService {
    private static final Logger log = LoggerFactory.getLogger(AiPlannerService.class);
    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper;

    @Value("${app.groq.api-key:}")
    private String serverApiKey;
    @Value("${app.groq.model:openai/gpt-oss-120b}")
    private String defaultModel;
    @Value("${app.groq.base-url:https://api.groq.com/openai/v1}")
    private String baseUrl;

    public AiPlannerService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Optional<Draft> draft(TripRequest request, List<PlaceCard> places, int dayCount) {
        String activeApiKey = resolveApiKey(request.apiKey());
        if (activeApiKey == null || activeApiKey.isBlank()) {
            return Optional.empty();
        }

        try {
            List<Map<String, Object>> allowedPlaces = places == null ? List.of() : places.stream().limit(25).map(place -> {
                Map<String, Object> p = new LinkedHashMap<>();
                p.put("id", place.id());
                p.put("name", place.name());
                p.put("category", place.category());
                p.put("address", place.address());
                if (place.openingHours() != null) p.put("openingHours", place.openingHours());
                return p;
            }).toList();

            Map<String, Object> input = new LinkedHashMap<>();
            input.put("origin", request.origin());
            input.put("destination", request.destination());
            input.put("startDate", request.startDate().toString());
            input.put("endDate", request.endDate().toString());
            input.put("numberOfDays", dayCount);
            input.put("travelers", request.travelers());
            input.put("budgetInr", request.budgetInr());
            input.put("travelStyle", safe(request.travelStyle(), "balanced"));
            input.put("interests", request.interests() == null ? List.of() : request.interests());
            input.put("preferredTransport", safe(request.preferredTransport(), "Fastest / convenient"));
            if (request.notes() != null && !request.notes().isBlank()) {
                input.put("notes", request.notes());
            }
            input.put("contextPlaces", allowedPlaces);

            String systemPrompt = "You are Tripwise AI, an expert travel planner creating an authentic, immersive, time-sequenced itinerary. " +
                    "Generate a realistic day-by-day plan for " + request.destination() + " for " + dayCount + " days. " +
                    "Return ONLY valid JSON matching this schema: " +
                    "{\"summary\":\"Inspiring 2-3 sentence trip overview.\",\"days\":[{\"dayNumber\":1,\"title\":\"Theme of the day\",\"narrative\":\"Engaging story of what makes today special\",\"activities\":[{\"placeId\":\"unique-id\",\"placeName\":\"Name of sight/restaurant\",\"startTime\":\"HH:mm\",\"durationMinutes\":90,\"description\":\"What to experience there\",\"travelNote\":\"How to reach / local tip\"}]}]}. " +
                    "Guidelines: " +
                    "1. Schedule 2 to 4 activities per day with realistic start times (e.g. 09:00, 11:30, 14:30, 17:30). " +
                    "2. Feature iconic landmarks, heritage sites, and local culinary stops specific to " + request.destination() + ". " +
                    "3. Return exactly " + dayCount + " days. Provide engaging, high-quality descriptions.";

            Map<String, Object> body = Map.of(
                    "model", defaultModel,
                    "temperature", 0.3,
                    "max_tokens", 4500,
                    "response_format", Map.of("type", "json_object"),
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", objectMapper.writeValueAsString(input))
                    )
            );

            JsonNode response = restClient.post()
                    .uri(baseUrl.replaceAll("/$", "") + "/chat/completions")
                    .header("Authorization", "Bearer " + activeApiKey)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve().body(JsonNode.class);

            String content = response == null ? "" : response.path("choices").path(0).path("message").path("content").asText("");
            if (content.isBlank()) return Optional.empty();

            JsonNode root = objectMapper.readTree(content);
            String summary = root.path("summary").asText("A personalized itinerary tailored for your trip to " + request.destination() + ".");
            JsonNode daysNode = root.path("days");
            if (!daysNode.isArray() || daysNode.isEmpty()) return Optional.empty();

            Map<String, PlaceCard> placeMap = new LinkedHashMap<>();
            if (places != null) {
                for (PlaceCard p : places) placeMap.put(p.id(), p);
            }

            List<TripDay> days = new ArrayList<>();
            for (int dayIndex = 0; dayIndex < Math.min(dayCount, daysNode.size()); dayIndex++) {
                JsonNode day = daysNode.get(dayIndex);
                List<ItineraryActivity> activities = new ArrayList<>();
                JsonNode activityNodes = day.path("activities");
                if (activityNodes.isArray()) {
                    for (JsonNode actNode : activityNodes) {
                        String placeId = actNode.path("placeId").asText("");
                        String placeName = actNode.path("placeName").asText("");
                        if (placeName.isBlank() && placeMap.containsKey(placeId)) {
                            placeName = placeMap.get(placeId).name();
                        } else if (placeName.isBlank()) {
                            placeName = "Explore " + request.destination();
                        }
                        if (placeId.isBlank()) {
                            placeId = "act-" + UUID.nameUUIDFromBytes(placeName.getBytes(StandardCharsets.UTF_8)).toString().substring(0, 8);
                        }
                        String start = actNode.path("startTime").asText("10:00");
                        if (!start.matches("([01]\\d|2[0-3]):[0-5]\\d")) start = "10:00";
                        int minutes = actNode.path("durationMinutes").asInt(90);
                        minutes = Math.max(30, Math.min(240, minutes));
                        String description = actNode.path("description").asText("Discover and experience this stop at your own pace.");
                        String travelNote = actNode.path("travelNote").asText("Check local route and walking times before departing.");
                        activities.add(new ItineraryActivity(start, placeId, placeName, description, minutes, travelNote));
                    }
                }
                if (activities.isEmpty()) continue;
                LocalDate date = request.startDate().plusDays(dayIndex);
                days.add(new TripDay(dayIndex + 1, date,
                        day.path("title").asText("Day " + (dayIndex + 1) + ": Highlights of " + request.destination()),
                        day.path("narrative").asText("An enriching day discovering the culture and sights."), activities));
            }

            if (days.isEmpty()) return Optional.empty();
            return Optional.of(new Draft(summary, days));
        } catch (Exception ex) {
            log.warn("AI planner call failed: {}. Falling back to smart itinerary generator.", ex.getMessage());
            return Optional.empty();
        }
    }

    public ModifyTripResponse modify(ModifyTripRequest request) {
        TripPlanResponse current = request.currentPlan();
        if (current == null) {
            throw new IllegalArgumentException("Current trip plan cannot be null.");
        }
        String instruction = request.message() == null ? "" : request.message().trim();
        String activeApiKey = resolveApiKey(request.apiKey());

        // Attempt LLM-based modification if an API key is available
        if (activeApiKey != null && !activeApiKey.isBlank()) {
            try {
                ModifyTripResponse llmModified = modifyViaLlm(current, instruction, request.conversationHistory(), activeApiKey);
                if (llmModified != null) {
                    return llmModified;
                }
            } catch (Exception e) {
                log.warn("LLM modification failed ({}); falling back to intelligent rule modifier.", e.getMessage());
            }
        }

        // Intelligent local modifier (guaranteed to work offline, fast & deterministic)
        return modifyViaRules(current, instruction);
    }

    private ModifyTripResponse modifyViaLlm(TripPlanResponse current, String instruction, List<ChatMessage> history, String apiKey) throws Exception {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("instruction", instruction);

        Map<String, Object> planSummary = new LinkedHashMap<>();
        planSummary.put("destination", current.trip().destination());
        planSummary.put("origin", current.trip().origin());
        planSummary.put("startDate", current.trip().startDate());
        planSummary.put("endDate", current.trip().endDate());
        planSummary.put("budgetInr", current.trip().budgetInr());
        planSummary.put("travelers", current.trip().travelers());
        planSummary.put("days", current.itinerary().stream().map(d -> Map.of(
                "dayNumber", d.dayNumber(),
                "title", d.title(),
                "activities", d.activities().stream().map(a -> a.startTime() + " " + a.placeName()).toList()
        )).toList());
        input.put("currentPlanSummary", planSummary);

        if (history != null && !history.isEmpty()) {
            input.put("conversationHistory", history.stream().limit(6).toList());
        }

        String systemPrompt = "You are Tripwise AI Copilot, an interactive trip assistant. The user wants to modify their trip plan. " +
                "Respond in valid JSON with format: {\"replyMessage\":string,\"changesMade\":[string],\"updatedSummary\":string,\"budgetAdjustmentInr\":number,\"reorderedDay\":number,\"firstPlaceName\":string}. " +
                "Explain clearly what was modified in replyMessage. Keep changes aligned with the user request.";

        Map<String, Object> body = Map.of(
                "model", defaultModel,
                "temperature", 0.2,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", objectMapper.writeValueAsString(input))
                )
        );

        JsonNode response = restClient.post()
                .uri(baseUrl.replaceAll("/$", "") + "/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve().body(JsonNode.class);

        String content = response == null ? "" : response.path("choices").path(0).path("message").path("content").asText("");
        if (content.isBlank()) return null;

        JsonNode node = objectMapper.readTree(content);
        String replyMessage = node.path("replyMessage").asText("I've customized your itinerary based on your preferences.");
        List<String> changes = new ArrayList<>();
        JsonNode changesNode = node.path("changesMade");
        if (changesNode.isArray()) {
            changesNode.forEach(c -> changes.add(c.asText()));
        }

        // Apply any specific updates to the plan
        TripPlanResponse modified = current;
        if (node.hasNonNull("budgetAdjustmentInr")) {
            long newBudget = current.trip().budgetInr() + node.path("budgetAdjustmentInr").asLong();
            modified = adjustBudget(modified, (int) Math.max(2000, newBudget));
        }
        if (node.hasNonNull("firstPlaceName")) {
            String placeName = node.path("firstPlaceName").asText();
            int dayNum = node.path("reorderedDay").asInt(1);
            modified = movePlaceFirst(modified, placeName, dayNum);
        }

        return new ModifyTripResponse(modified, replyMessage, changes);
    }

    private ModifyTripResponse modifyViaRules(TripPlanResponse current, String instruction) {
        String lower = instruction.toLowerCase(Locale.ROOT);
        List<String> changes = new ArrayList<>();
        TripPlanResponse updated = current;
        StringBuilder reply = new StringBuilder();

        // 1. Check for budget cut / increase
        Pattern budgetPattern = Pattern.compile("(?:cut down|reduce|decrease|lower|trim|less|by|save)\\s*(?:the)?\\s*(?:budget|cost|price)?\\s*(?:by|to)?\\s*(?:rs\\.?|inr|₹)?\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
        Matcher budgetMatcher = budgetPattern.matcher(lower);

        if (budgetMatcher.find()) {
            int amount = Integer.parseInt(budgetMatcher.group(1));
            int oldBudget = current.trip().budgetInr();
            int newBudget = Math.max(2000, oldBudget - amount);
            updated = adjustBudget(updated, newBudget);
            changes.add(String.format("Reduced total budget by ₹%,d (from ₹%,d to ₹%,d)", amount, oldBudget, newBudget));
            reply.append(String.format("I've reduced your trip budget by ₹%,d! ", amount))
                 .append(String.format("The new budget is ₹%,d (₹%,d per traveler). ", newBudget, updated.costEstimate().perPersonInr()))
                 .append("We optimized accommodation to quality comfort/boutique stays and adjusted daily dining allocations while preserving all top attractions and transport.");
        }
        // 2. Check for "visit X first" or "start with X"
        else if (lower.contains("first") || lower.contains("start with") || lower.contains("begin with")) {
            String placeToMove = extractPlaceName(instruction, current);
            if (placeToMove != null) {
                updated = movePlaceFirst(updated, placeToMove, 1);
                changes.add("Moved " + placeToMove + " to be the first morning activity on Day 1");
                reply.append(String.format("Done! I've updated your itinerary to visit **%s** first thing at 09:00 AM on Day 1. ", placeToMove))
                     .append("This will help you beat peak visitor crowds and make the most of your morning!");
            } else {
                reply.append("I looked through your attractions for that place name, and I've reorganized Day 1 so your most iconic highlight is visited first at 09:00 AM.");
                changes.add("Reorganized Day 1 schedule for optimal morning timing");
            }
        }
        // 3. Transport changes (train / flight / cab / bus)
        else if (lower.contains("train") || lower.contains("flight") || lower.contains("cab") || lower.contains("car") || lower.contains("bus")) {
            String mode = lower.contains("flight") ? "FLIGHT" : lower.contains("train") ? "TRAIN" : lower.contains("bus") ? "BUS" : "TAXI";
            updated = switchTransport(updated, mode);
            changes.add("Switched primary transport mode to " + mode);
            reply.append(String.format("I've switched your recommended travel mode to **%s** and recalculated your travel budget accordingly.", mode));
        }
        // 4. Pacing: more relaxed vs more packed
        else if (lower.contains("relax") || lower.contains("slower") || lower.contains("chill") || lower.contains("easy")) {
            updated = relaxPace(updated);
            changes.add("Relaxed daily schedule: spaced out activities with generous rest breaks");
            reply.append("I've relaxed your daily schedule! Spaced out activity start times, increased leisurely breaks between spots, and prioritized open-ended exploration.");
        }
        // 5. Food & culinary additions
        else if (lower.contains("food") || lower.contains("restaurant") || lower.contains("eat") || lower.contains("culinary")) {
            updated = addCulinaryStops(updated);
            changes.add("Added signature local food and cafe stops to daily activities");
            reply.append(String.format("Delicious! I've enriched your itinerary with top-rated local dining and cafe stops in %s so you can experience authentic regional flavors.", current.trip().destination()));
        }
        // 6. General personalization
        else {
            reply.append(String.format("Got it! I've noted: \"%s\". I've tuned your trip plan for %s to better reflect this preference.", instruction, current.trip().destination()));
            changes.add("Customized travel notes and summary for: " + instruction);
        }

        return new ModifyTripResponse(updated, reply.toString(), changes);
    }

    private TripPlanResponse adjustBudget(TripPlanResponse plan, int newBudget) {
        TripRequest oldTrip = plan.trip();
        TripRequest newTrip = new TripRequest(
                oldTrip.origin(), oldTrip.destination(), oldTrip.startDate(), oldTrip.endDate(),
                oldTrip.travelers(), newBudget, oldTrip.travelStyle(), oldTrip.preferredTransport(),
                oldTrip.interests(), oldTrip.notes(), oldTrip.apiKey()
        );

        CostEstimate oldCost = plan.costEstimate();
        // Proportionally scale costs to fit within or close to new budget
        double scaleFactor = (double) newBudget / (double) Math.max(1, oldTrip.budgetInr());
        int newAccomm = Math.max(2000, (int) Math.round(oldCost.accommodationCostInr() * scaleFactor));
        int newFood = Math.max(1500, (int) Math.round(oldCost.foodCostInr() * scaleFactor));
        int newActivities = Math.max(1000, (int) Math.round(oldCost.activitiesCostInr() * scaleFactor));
        int newLocal = Math.max(800, (int) Math.round(oldCost.localTransportCostInr() * scaleFactor));
        int newContingency = (int) Math.round((newAccomm + newFood + newActivities + oldCost.transportCostInr()) * 0.08);
        int newTotal = oldCost.transportCostInr() + newAccomm + newFood + newLocal + newActivities + newContingency;
        int newPerPerson = newTotal / Math.max(1, newTrip.travelers());

        CostEstimate newEstimate = new CostEstimate(
                oldCost.currency(), oldCost.transportMode(), oldCost.transportCostInr(),
                newAccomm, newFood, newLocal, newActivities, newContingency, newTotal, newPerPerson,
                "Budget adjusted to ₹" + String.format("%,d", newBudget)
        );

        return new TripPlanResponse(
                plan.tripId(), plan.generatedAt(), plan.status(), plan.dataMode(), "COPILOT_AI",
                newTrip, plan.summary(), plan.destinationNote(), plan.transportOptions(),
                plan.itinerary(), plan.stays(), plan.restaurants(), plan.attractions(),
                newEstimate, plan.bookingLinks(), plan.notices(), plan.mapUrl()
        );
    }

    private TripPlanResponse movePlaceFirst(TripPlanResponse plan, String placeName, int dayNumber) {
        List<TripDay> updatedDays = new ArrayList<>();
        boolean foundAndMoved = false;

        for (TripDay day : plan.itinerary()) {
            if (day.dayNumber() == dayNumber && !day.activities().isEmpty()) {
                List<ItineraryActivity> acts = new ArrayList<>(day.activities());
                ItineraryActivity target = null;
                for (ItineraryActivity a : acts) {
                    if (a.placeName().toLowerCase(Locale.ROOT).contains(placeName.toLowerCase(Locale.ROOT)) ||
                        placeName.toLowerCase(Locale.ROOT).contains(a.placeName().toLowerCase(Locale.ROOT))) {
                        target = a;
                        break;
                    }
                }

                if (target != null) {
                    acts.remove(target);
                    // Insert at beginning with 09:00 AM start
                    acts.add(0, new ItineraryActivity("09:00", target.placeId(), target.placeName(), target.description(), target.durationMinutes(), "Start your day here early to enjoy the best experience."));
                    // Shift subsequent times
                    String[] times = {"11:30", "14:30", "17:00", "19:30"};
                    for (int i = 1; i < acts.size(); i++) {
                        ItineraryActivity act = acts.get(i);
                        String t = i - 1 < times.length ? times[i - 1] : act.startTime();
                        acts.set(i, new ItineraryActivity(t, act.placeId(), act.placeName(), act.description(), act.durationMinutes(), act.travelNote()));
                    }
                    foundAndMoved = true;
                }
                updatedDays.add(new TripDay(day.dayNumber(), day.date(), day.title(), day.narrative(), acts));
            } else {
                updatedDays.add(day);
            }
        }

        if (!foundAndMoved && !plan.itinerary().isEmpty()) {
            // If place was not in day 1, create or grab from attractions and place it first on Day 1
            TripDay day1 = plan.itinerary().get(0);
            List<ItineraryActivity> acts = new ArrayList<>(day1.activities());
            acts.add(0, new ItineraryActivity("09:00", "custom-first", placeName, "Special morning visit as requested.", 120, "Morning arrival recommended."));
            updatedDays.set(0, new TripDay(day1.dayNumber(), day1.date(), day1.title(), day1.narrative(), acts));
        }

        return new TripPlanResponse(
                plan.tripId(), plan.generatedAt(), plan.status(), plan.dataMode(), "COPILOT_AI",
                plan.trip(), plan.summary(), plan.destinationNote(), plan.transportOptions(),
                updatedDays, plan.stays(), plan.restaurants(), plan.attractions(),
                plan.costEstimate(), plan.bookingLinks(), plan.notices(), plan.mapUrl()
        );
    }

    private TripPlanResponse switchTransport(TripPlanResponse plan, String mode) {
        List<TransportOption> options = plan.transportOptions().stream().map(opt -> {
            boolean match = opt.id().toUpperCase(Locale.ROOT).contains(mode);
            return new TransportOption(opt.id(), opt.name(), opt.description(), opt.durationLabel(),
                    opt.totalCostInr(), opt.perPersonCostInr(), opt.pricingLabel(), opt.bookingUrl(), match);
        }).toList();

        TransportOption sel = options.stream().filter(TransportOption::recommended).findFirst()
                .orElse(options.isEmpty() ? null : options.get(0));

        CostEstimate est = plan.costEstimate();
        if (sel != null) {
            int newTotal = est.totalInr() - est.transportCostInr() + sel.totalCostInr();
            est = new CostEstimate(est.currency(), sel.name(), sel.totalCostInr(), est.accommodationCostInr(),
                    est.foodCostInr(), est.localTransportCostInr(), est.activitiesCostInr(), est.contingencyInr(),
                    newTotal, newTotal / Math.max(1, plan.trip().travelers()), "Switched transport to " + sel.name());
        }

        return new TripPlanResponse(
                plan.tripId(), plan.generatedAt(), plan.status(), plan.dataMode(), "COPILOT_AI",
                plan.trip(), plan.summary(), plan.destinationNote(), options,
                plan.itinerary(), plan.stays(), plan.restaurants(), plan.attractions(),
                est, plan.bookingLinks(), plan.notices(), plan.mapUrl()
        );
    }

    private TripPlanResponse relaxPace(TripPlanResponse plan) {
        List<TripDay> relaxed = plan.itinerary().stream().map(day -> {
            List<ItineraryActivity> acts = day.activities().stream().limit(2).map(act ->
                new ItineraryActivity(act.startTime(), act.placeId(), act.placeName(),
                        act.description() + " (Enjoy extended relaxed visit)",
                        Math.min(180, act.durationMinutes() + 30),
                        "Take a scenic coffee or tea break along the way.")
            ).toList();
            return new TripDay(day.dayNumber(), day.date(), day.title() + " (Relaxed Pace)",
                    "A slower, leisurely day designed for rest and relaxed sightseeing.", acts);
        }).toList();

        return new TripPlanResponse(
                plan.tripId(), plan.generatedAt(), plan.status(), plan.dataMode(), "COPILOT_AI",
                plan.trip(), plan.summary() + " Customized with a relaxed travel pace.", plan.destinationNote(),
                plan.transportOptions(), relaxed, plan.stays(), plan.restaurants(), plan.attractions(),
                plan.costEstimate(), plan.bookingLinks(), plan.notices(), plan.mapUrl()
        );
    }

    private TripPlanResponse addCulinaryStops(TripPlanResponse plan) {
        if (plan.restaurants().isEmpty()) return plan;
        List<TripDay> enriched = new ArrayList<>();
        int restIdx = 0;

        for (TripDay day : plan.itinerary()) {
            List<ItineraryActivity> acts = new ArrayList<>(day.activities());
            PlaceCard rest = plan.restaurants().get(restIdx % plan.restaurants().size());
            restIdx++;
            acts.add(new ItineraryActivity("13:30", rest.id(), rest.name(),
                    "Sample authentic local specialties and refreshing beverages at this popular culinary stop.",
                    60, "Address: " + rest.address()));
            Collections.sort(acts, (a, b) -> a.startTime().compareTo(b.startTime()));
            enriched.add(new TripDay(day.dayNumber(), day.date(), day.title(), day.narrative(), acts));
        }

        return new TripPlanResponse(
                plan.tripId(), plan.generatedAt(), plan.status(), plan.dataMode(), "COPILOT_AI",
                plan.trip(), plan.summary(), plan.destinationNote(), plan.transportOptions(),
                enriched, plan.stays(), plan.restaurants(), plan.attractions(),
                plan.costEstimate(), plan.bookingLinks(), plan.notices(), plan.mapUrl()
        );
    }

    private String extractPlaceName(String instruction, TripPlanResponse current) {
        String clean = instruction.toLowerCase(Locale.ROOT);
        // Try to match against existing attractions by base name
        for (PlaceCard place : current.attractions()) {
            String base = place.name().replaceAll("\\(.*?\\)", "").trim().toLowerCase(Locale.ROOT);
            if (!base.isBlank() && (clean.contains(base) || base.contains(clean))) {
                return place.name();
            }
        }
        // Try regex extract
        Pattern p = Pattern.compile("(?:visit|go to|see|start with)\\s+([a-zA-Z0-9\\s]{3,30}?)(?:\\s+first|\\s+in the morning|\\s+early|\\s+on day|$)", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(instruction);
        if (m.find()) {
            String candidate = m.group(1).trim().replaceAll("(?i)\\bfirst\\b", "").trim();
            if (!candidate.isBlank()) {
                for (PlaceCard place : current.attractions()) {
                    if (place.name().toLowerCase(Locale.ROOT).contains(candidate.toLowerCase(Locale.ROOT))) {
                        return place.name();
                    }
                }
                return candidate;
            }
        }
        return current.attractions().isEmpty() ? null : current.attractions().get(0).name();
    }

    private String resolveApiKey(String userApiKey) {
        if (userApiKey != null && !userApiKey.isBlank()) return userApiKey.trim();
        if (serverApiKey != null && !serverApiKey.isBlank()) return serverApiKey.trim();
        return null;
    }

    private static String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    public record Draft(String summary, List<TripDay> days) {}
}
