package com.tripwise.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record TripRequest(
        @NotBlank @Size(max = 180) String origin,
        @NotBlank @Size(max = 180) String destination,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @Min(1) int travelers,
        @Min(1000) int budgetInr,
        String travelStyle,
        String preferredTransport,
        List<String> interests,
        String notes,
        String apiKey
) {
    public TripRequest(String origin, String destination, LocalDate startDate, LocalDate endDate,
                       int travelers, int budgetInr, String travelStyle, String preferredTransport,
                       List<String> interests) {
        this(origin, destination, startDate, endDate, travelers, budgetInr, travelStyle, preferredTransport, interests, null, null);
    }
}
