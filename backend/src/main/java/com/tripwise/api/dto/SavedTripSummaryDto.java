package com.tripwise.api.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SavedTripSummaryDto(
        UUID id,
        String origin,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        int travelers,
        int budgetInr,
        int totalCostInr,
        String summary,
        Instant createdAt
) {}
