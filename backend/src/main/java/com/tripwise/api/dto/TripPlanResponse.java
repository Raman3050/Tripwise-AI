package com.tripwise.api.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record TripPlanResponse(
        String tripId,
        Instant generatedAt,
        String status,
        String dataMode,
        String aiMode,
        TripRequest trip,
        String summary,
        String destinationNote,
        List<TransportOption> transportOptions,
        List<TripDay> itinerary,
        List<PlaceCard> stays,
        List<PlaceCard> restaurants,
        List<PlaceCard> attractions,
        CostEstimate costEstimate,
        List<BookingLink> bookingLinks,
        List<String> notices,
        String mapUrl
) {
    public record PlaceCard(
            String id,
            String name,
            String category,
            String address,
            Double latitude,
            Double longitude,
            String openingHours,
            String website,
            String mapUrl,
            String dataSource,
            boolean verified
    ) {}

    public record ItineraryActivity(
            String startTime,
            String placeId,
            String placeName,
            String description,
            int durationMinutes,
            String travelNote
    ) {}

    public record TripDay(
            int dayNumber,
            LocalDate date,
            String title,
            String narrative,
            List<ItineraryActivity> activities
    ) {}

    public record TransportOption(
            String id,
            String name,
            String description,
            String durationLabel,
            int totalCostInr,
            int perPersonCostInr,
            String pricingLabel,
            String bookingUrl,
            boolean recommended
    ) {}

    public record CostEstimate(
            String currency,
            String transportMode,
            int transportCostInr,
            int accommodationCostInr,
            int foodCostInr,
            int localTransportCostInr,
            int activitiesCostInr,
            int contingencyInr,
            int totalInr,
            int perPersonInr,
            String note
    ) {}

    public record BookingLink(String title, String description, String url, String category) {}
}
