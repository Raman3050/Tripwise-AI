package com.tripwise.api.dto;

import java.util.List;

public record ModifyTripRequest(
        TripPlanResponse currentPlan,
        String message,
        List<ChatMessage> conversationHistory,
        String apiKey
) {}
