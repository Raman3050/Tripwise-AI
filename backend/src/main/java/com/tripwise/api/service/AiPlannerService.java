package com.tripwise.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripwise.api.dto.TripPlanResponse.ItineraryActivity;
import com.tripwise.api.dto.TripPlanResponse.PlaceCard;
import com.tripwise.api.dto.TripPlanResponse.TripDay;
import com.tripwise.api.dto.TripRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AiPlannerService {
    private static final Logger log = LoggerFactory.getLogger(AiPlannerService.class);
    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper;

    @Value("${app.groq.api-key:}")
    private String apiKey;
    @Value("${app.groq.model:openai/gpt-oss-120b}")
    private String model;
    @Value("${app.groq.base-url:https://api.groq.com/openai/v1}")
    private String baseUrl;

    public AiPlannerService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Optional<Draft> draft(TripRequest request, List<PlaceCard> places, int dayCount) {
        if (apiKey == null || apiKey.isBlank() || places == null || places.isEmpty()) return Optional.empty();
        try {
            List<Map<String, Object>> allowedPlaces = places.stream().limit(30).map(place -> {
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
            input.put("allowedPlaces", allowedPlaces);

            String systemPrompt = "You are the itinerary-planning engine for Tripwise AI. Create a practical, relaxed day-by-day itinerary. " +
                    "Return only valid JSON with this exact shape: {\"summary\":string,\"days\":[{\"dayNumber\":number,\"title\":string,\"narrative\":string,\"activities\":[{\"placeId\":string,\"startTime\":\"HH:mm\",\"durationMinutes\":number,\"description\":string,\"travelNote\":string}]}]}. " +
                    "Use only place IDs from allowedPlaces. Never invent a place, opening hours, ticket price, fare, availability, or booking confirmation. Do not claim places are open; suggest checking their hours. " +
                    "Group nearby places where the address suggests it. Plan between 2 and 4 activities per full day if there are enough places, leave meal/rest breaks, and do not overpack the schedule. " +
                    "If there are fewer places than days, reuse only when necessary and vary the day theme. Return exactly numberOfDays day entries. All costs are handled separately by the application.";
            Map<String, Object> body = Map.of(
                    "model", model,
                    "temperature", 0.2,
                    "max_tokens", 4500,
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
            if (content.isBlank()) return Optional.empty();

            JsonNode root = objectMapper.readTree(content);
            String summary = root.path("summary").asText("A flexible itinerary shaped around your trip details.");
            JsonNode daysNode = root.path("days");
            if (!daysNode.isArray() || daysNode.isEmpty()) return Optional.empty();
            Map<String, PlaceCard> allowedById = new LinkedHashMap<>();
            for (PlaceCard place : places) allowedById.put(place.id(), place);
            List<TripDay> days = new ArrayList<>();
            for (int dayIndex = 0; dayIndex < Math.min(dayCount, daysNode.size()); dayIndex++) {
                JsonNode day = daysNode.get(dayIndex);
                List<ItineraryActivity> activities = new ArrayList<>();
                JsonNode activityNodes = day.path("activities");
                if (activityNodes.isArray()) {
                    for (JsonNode activity : activityNodes) {
                        String placeId = activity.path("placeId").asText("");
                        PlaceCard place = allowedById.get(placeId);
                        if (place == null) continue; // Fail closed if the model invents an identifier.
                        String start = activity.path("startTime").asText("10:00");
                        if (!start.matches("([01]\\d|2[0-3]):[0-5]\\d")) start = "10:00";
                        int minutes = activity.path("durationMinutes").asInt(90);
                        minutes = Math.max(30, Math.min(180, minutes));
                        String description = activity.path("description").asText("Explore this stop at your own pace and confirm current visitor information.");
                        String travelNote = activity.path("travelNote").asText("Check the route and local travel time before leaving.");
                        activities.add(new ItineraryActivity(start, place.id(), place.name(), description, minutes, travelNote));
                    }
                }
                if (activities.isEmpty()) continue;
                LocalDate date = request.startDate().plusDays(dayIndex);
                days.add(new TripDay(dayIndex + 1, date,
                        day.path("title").asText("Explore " + request.destination()),
                        day.path("narrative").asText("A flexible day to explore at a comfortable pace."), activities));
            }
            if (days.size() != dayCount) return Optional.empty();
            return Optional.of(new Draft(summary, days));
        } catch (Exception ex) {
            log.warn("Groq itinerary generation failed; using rule-based planner: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private static String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    public record Draft(String summary, List<TripDay> days) {}
}
