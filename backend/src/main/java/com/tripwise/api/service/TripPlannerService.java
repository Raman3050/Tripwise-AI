package com.tripwise.api.service;

import com.tripwise.api.dto.TripPlanResponse;
import com.tripwise.api.dto.TripPlanResponse.BookingLink;
import com.tripwise.api.dto.TripPlanResponse.CostEstimate;
import com.tripwise.api.dto.TripPlanResponse.ItineraryActivity;
import com.tripwise.api.dto.TripPlanResponse.PlaceCard;
import com.tripwise.api.dto.TripPlanResponse.TransportOption;
import com.tripwise.api.dto.TripPlanResponse.TripDay;
import com.tripwise.api.dto.TripRequest;
import com.tripwise.api.service.GeoapifyClient.GeoPoint;
import com.tripwise.api.service.GeoapifyClient.LiveSnapshot;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class TripPlannerService {
    private final GeoapifyClient geoapifyClient;
    private final DemoDataService demoDataService;
    private final AiPlannerService aiPlannerService;
    private final BookingLinkService bookingLinkService;

    public TripPlannerService(GeoapifyClient geoapifyClient, DemoDataService demoDataService,
                              AiPlannerService aiPlannerService, BookingLinkService bookingLinkService) {
        this.geoapifyClient = geoapifyClient;
        this.demoDataService = demoDataService;
        this.aiPlannerService = aiPlannerService;
        this.bookingLinkService = bookingLinkService;
    }

    public TripPlanResponse plan(TripRequest request) {
        validate(request);
        int dayCount = Math.toIntExact(ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1);
        int nights = Math.toIntExact(ChronoUnit.DAYS.between(request.startDate(), request.endDate()));

        Optional<LiveSnapshot> snapshotOptional = geoapifyClient.fetchTripData(request);
        LiveSnapshot snapshot = snapshotOptional.orElse(null);
        List<PlaceCard> liveAttractions = snapshot == null ? List.of() : snapshot.attractions();
        List<PlaceCard> liveHotels = snapshot == null ? List.of() : snapshot.hotels();
        List<PlaceCard> liveRestaurants = snapshot == null ? List.of() : snapshot.restaurants();

        List<PlaceCard> attractions = liveAttractions.isEmpty() ? demoDataService.attractions(request.destination()) : liveAttractions;
        List<PlaceCard> stays = liveHotels.isEmpty() ? demoDataService.hotels(request.destination()) : liveHotels;
        List<PlaceCard> restaurants = liveRestaurants.isEmpty() ? demoDataService.restaurants(request.destination()) : liveRestaurants;
        boolean anyLive = !liveAttractions.isEmpty() || !liveHotels.isEmpty() || !liveRestaurants.isEmpty();
        boolean allLive = !liveAttractions.isEmpty() && !liveHotels.isEmpty() && !liveRestaurants.isEmpty();
        String dataMode = allLive ? "LIVE_DATA" : (anyLive ? "MIXED_DATA" : "DEMO_DATA");

        Optional<AiPlannerService.Draft> aiDraft = aiPlannerService.draft(request, attractions, dayCount);
        List<TripDay> itinerary = aiDraft.map(AiPlannerService.Draft::days)
                .orElseGet(() -> ruleBasedItinerary(request, attractions, dayCount));
        String aiMode = aiDraft.isPresent() ? "GROQ_AI" : "RULE_BASED";
        String summary = aiDraft.map(AiPlannerService.Draft::summary).orElseGet(() -> fallbackSummary(request, dayCount));

        double distanceKm = snapshot != null && snapshot.distanceKm() != null
                ? snapshot.distanceKm() : fallbackDistanceKm(request.origin(), request.destination());
        Integer drivingMinutes = snapshot == null ? null : snapshot.drivingMinutes();
        List<TransportOption> rawTransportOptions = buildTransportOptions(request, distanceKm, drivingMinutes);
        TransportOption selected = chooseTransport(request.preferredTransport(), rawTransportOptions);
        List<TransportOption> transportOptions = rawTransportOptions.stream()
                .map(option -> new TransportOption(option.id(), option.name(), option.description(), option.durationLabel(),
                        option.totalCostInr(), option.perPersonCostInr(), option.pricingLabel(), option.bookingUrl(),
                        option.id().equals(selected.id())))
                .toList();
        CostEstimate costEstimate = estimateCosts(request, dayCount, nights, selected, distanceKm);
        List<BookingLink> bookingLinks = bookingLinkService.createLinks(request);
        List<String> notices = buildNotices(dataMode, aiMode, costEstimate, request);
        String destinationNote = anyLive
                ? "Place listings were retrieved from Geoapify. Listing details and opening hours can still be incomplete; confirm directly before visiting."
                : "Demo mode is active. Sample places are shown so you can try the complete flow without external API keys.";

        return new TripPlanResponse(UUID.randomUUID().toString(), Instant.now(), "READY", dataMode, aiMode,
                request, summary, destinationNote, transportOptions, itinerary,
                stays.stream().limit(6).toList(), restaurants.stream().limit(6).toList(),
                attractions.stream().limit(10).toList(), costEstimate, bookingLinks, notices,
                bookingLinkService.mapUrl(request));
    }

    private void validate(TripRequest request) {
        if (request.startDate() == null || request.endDate() == null) {
            throw new IllegalArgumentException("Please provide both a departure date and a return date.");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("Return date must be on or after departure date.");
        }
        if (request.startDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Departure date must be today or a future date.");
        }
        long days = ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1;
        if (days > 14) {
            throw new IllegalArgumentException("For this MVP, please plan trips of 14 days or fewer.");
        }
        if (request.travelers() < 1 || request.travelers() > 12) {
            throw new IllegalArgumentException("Please choose between 1 and 12 travelers.");
        }
        if (request.budgetInr() < 1000) {
            throw new IllegalArgumentException("Budget must be at least ₹1,000.");
        }
    }

    private List<TripDay> ruleBasedItinerary(TripRequest request, List<PlaceCard> places, int dayCount) {
        List<PlaceCard> available = places == null ? List.of() : places;
        List<TripDay> days = new ArrayList<>();
        String destination = request.destination().split(",")[0].trim();
        for (int dayIndex = 0; dayIndex < dayCount; dayIndex++) {
            List<ItineraryActivity> activities = new ArrayList<>();
            int perDay = Math.min(3, Math.max(1, available.size()));
            for (int slot = 0; slot < perDay; slot++) {
                if (available.isEmpty()) break;
                int placeIndex = (dayIndex * 2 + slot) % available.size();
                PlaceCard place = available.get(placeIndex);
                String time = switch (slot) {
                    case 0 -> "09:30";
                    case 1 -> "12:00";
                    default -> "15:30";
                };
                String description = slot == 0
                        ? "Start the day here, allowing time to explore at your own pace. Confirm current opening hours and entry rules."
                        : slot == 1
                        ? "A second stop for the middle of the day. Check the route from your previous stop and leave time for a meal."
                        : "An optional afternoon stop. Keep this flexible depending on local travel time and how the day feels.";
                activities.add(new ItineraryActivity(time, place.id(), place.name(), description,
                        slot == 0 ? 90 : 75, "Check the current route and travel time before leaving."));
            }
            String title = switch (dayIndex) {
                case 0 -> "First impressions & local highlights";
                case 1 -> "Culture, colour & local flavour";
                case 2 -> "A slower day of discovery";
                default -> "Explore at your own pace";
            };
            String narrative = request.travelStyle() != null && request.travelStyle().equalsIgnoreCase("comfort")
                    ? "A comfortable rhythm with breathing room between stops. Keep the order flexible around opening hours and traffic."
                    : "A suggested sequence of stops with room for meals, breaks and spontaneous discoveries. Verify hours and routes before setting off.";
            days.add(new TripDay(dayIndex + 1, request.startDate().plusDays(dayIndex), title + " in " + destination,
                    narrative, activities));
        }
        return days;
    }

    private String fallbackSummary(TripRequest request, int days) {
        String destination = request.destination().split(",")[0].trim();
        return "A " + days + "-day " + safe(request.travelStyle(), "balanced") + " trip to " + destination
                + ", with ideas grouped by day and an estimated budget for " + request.travelers()
                + (request.travelers() == 1 ? " traveler." : " travelers.");
    }

    private List<TransportOption> buildTransportOptions(TripRequest request, double distanceKm, Integer liveDrivingMinutes) {
        int travelers = request.travelers();
        double distance = Math.max(80, distanceKm);
        int returnRailPerPerson = (int) Math.round(Math.max(250, 150 + distance * 0.70) * 2);
        int returnBusPerPerson = (int) Math.round(Math.max(350, 220 + distance * 0.90) * 2);
        int returnFlightPerPerson = (int) Math.round(Math.max(1800, 2300 + distance * 0.60) * 2);
        int estimatedOneCarRoundTrip = (int) Math.round(distance * 2 * 10 + distance / 200 * 350);
        int vehiclesNeeded = (int) Math.ceil(travelers / 5.0);
        int carGroupCost = estimatedOneCarRoundTrip * vehiclesNeeded;
        String flightUrl = "https://www.google.com/travel/flights?q=" + encode("Flights from " + request.origin() + " to " + request.destination() + " " + request.startDate() + " return " + request.endDate());
        String trainUrl = "https://www.irctc.co.in/nget/train-search";
        String busUrl = "https://www.redbus.in/";
        String carUrl = bookingLinkService.mapUrl(request);
        int drivingMinutes = liveDrivingMinutes == null ? (int) Math.round(distance / 45 * 60) : liveDrivingMinutes;

        List<TransportOption> options = new ArrayList<>();
        options.add(new TransportOption("train", "Train", "Usually a practical balance for many domestic routes.",
                "~" + hours(Math.max(90, distance / 45 * 60)) + " (indicative)", returnRailPerPerson * travelers,
                returnRailPerPerson, "round-trip estimate, not a fare", trainUrl, false));
        options.add(new TransportOption("bus", "Intercity bus", "A flexible alternative; actual operators and schedules vary by route.",
                "~" + hours(Math.max(120, distance / 55 * 60)) + " (indicative)", returnBusPerPerson * travelers,
                returnBusPerPerson, "round-trip estimate, not a fare", busUrl, false));
        options.add(new TransportOption("flight", "Flight", "Can save travel time on longer routes; airport time is additional.",
                "~2–4 h including a planning allowance", returnFlightPerPerson * travelers,
                returnFlightPerPerson, "round-trip estimate, not a fare", flightUrl, false));
        options.add(new TransportOption("car", "Drive", "Flexible stops; estimate assumes up to 5 travelers per car.",
                "~" + hours(drivingMinutes) + " one way (route estimate)", carGroupCost,
                (int) Math.ceil((double) carGroupCost / travelers), "fuel/toll heuristic for group", carUrl, false));
        return options;
    }

    private TransportOption chooseTransport(String preference, List<TransportOption> options) {
        String pref = safe(preference, "cheapest").toLowerCase(Locale.ROOT);
        if (pref.equals("fastest")) return options.stream().filter(o -> o.id().equals("flight")).findFirst().orElse(options.get(0));
        if (List.of("train", "bus", "flight", "car").contains(pref)) {
            return options.stream().filter(o -> o.id().equals(pref)).findFirst().orElse(options.get(0));
        }
        return options.stream().min(Comparator.comparingInt(TransportOption::totalCostInr)).orElse(options.get(0));
    }

    private CostEstimate estimateCosts(TripRequest request, int days, int nights, TransportOption selected, double distanceKm) {
        int travelers = request.travelers();
        String style = safe(request.travelStyle(), "balanced").toLowerCase(Locale.ROOT);
        double roomNightRate = style.equals("comfort") ? 4500 : style.equals("budget") ? 1100 : 2200;
        double foodPerPersonDay = style.equals("comfort") ? 1400 : style.equals("budget") ? 450 : 800;
        double activitiesPerPersonDay = style.equals("comfort") ? 1200 : style.equals("budget") ? 300 : 650;
        double localGroupDay = style.equals("comfort") ? 1500 : style.equals("budget") ? 400 : 750;
        int rooms = (int) Math.ceil(travelers / 2.0);
        int accommodation = (int) Math.round(roomNightRate * rooms * nights);
        int food = (int) Math.round(foodPerPersonDay * travelers * days);
        int local = (int) Math.round(localGroupDay * days);
        int activities = (int) Math.round(activitiesPerPersonDay * travelers * days);
        int subtotal = selected.totalCostInr() + accommodation + food + local + activities;
        double contingencyRate = style.equals("comfort") ? 0.12 : style.equals("budget") ? 0.08 : 0.10;
        int contingency = (int) Math.round(subtotal * contingencyRate);
        int total = subtotal + contingency;
        return new CostEstimate("INR", selected.name(), selected.totalCostInr(), accommodation, food,
                local, activities, contingency, total, (int) Math.ceil((double) total / travelers),
                "Indicative planning estimate only. Stay, food, local travel and activity costs use configurable heuristics; no live hotel rate or ticket inventory is available. " +
                        "Transport option prices are estimated round-trip amounts and can differ materially from actual fares.");
    }

    private List<String> buildNotices(String dataMode, String aiMode, CostEstimate cost, TripRequest request) {
        List<String> notices = new ArrayList<>();
        if (!"LIVE_DATA".equals(dataMode)) {
            notices.add("Some or all place suggestions are sample/demo data. Check listings and details before making plans.");
        }
        notices.add("Transport prices are algorithmic estimates, not live fares, schedules, seat counts or ticket availability. Use the links to verify current options.");
        notices.add("Hotel/place suggestions do not confirm room rates or availability. Accommodation costs in the total are budget assumptions, not quoted offers.");
        if ("GROQ_AI".equals(aiMode)) {
            notices.add("The AI builds the schedule only from the returned place IDs. Verify opening hours, entry rules, weather and local travel conditions before departure.");
        } else {
            notices.add("AI key is not configured or did not return a valid itinerary; a deterministic rule-based itinerary was generated instead.");
        }
        if (cost.totalInr() > request.budgetInr()) {
            notices.add("The current estimate is above your budget. Try a lower-cost travel style or fewer paid activities.");
        }
        return notices;
    }

    private double fallbackDistanceKm(String origin, String destination) {
        String from = origin.toLowerCase(Locale.ROOT);
        String to = destination.toLowerCase(Locale.ROOT);
        if ((from.contains("delhi") && to.contains("jaipur")) || (from.contains("jaipur") && to.contains("delhi"))) return 280;
        if ((from.contains("delhi") && to.contains("agra")) || (from.contains("agra") && to.contains("delhi"))) return 230;
        if ((from.contains("delhi") && to.contains("manali")) || (from.contains("manali") && to.contains("delhi"))) return 540;
        if ((from.contains("delhi") && to.contains("goa")) || (from.contains("goa") && to.contains("delhi"))) return 1900;
        return 500; // used only to form clearly labelled estimates when live routing is unavailable
    }

    private String hours(double totalMinutes) {
        int h = (int) Math.floor(totalMinutes / 60);
        int m = (int) Math.round(totalMinutes % 60);
        if (m >= 60) { h++; m = 0; }
        return h + " h" + (m > 0 ? " " + m + " min" : "");
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
