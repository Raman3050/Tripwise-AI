package com.tripwise.api.dto;

import java.util.List;

public record ModifyTripResponse(
        TripPlanResponse updatedPlan,
        String replyMessage,
        List<String> changesMade
) {}
