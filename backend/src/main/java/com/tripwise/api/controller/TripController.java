package com.tripwise.api.controller;

import com.tripwise.api.dto.TripPlanResponse;
import com.tripwise.api.dto.TripRequest;
import com.tripwise.api.service.TripPlannerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class TripController {
    private final TripPlannerService tripPlannerService;

    public TripController(TripPlannerService tripPlannerService) {
        this.tripPlannerService = tripPlannerService;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "UP", "service", "tripwise-api");
    }

    @PostMapping("/trips/plan")
    public ResponseEntity<TripPlanResponse> plan(@Valid @RequestBody TripRequest request) {
        return ResponseEntity.ok(tripPlannerService.plan(request));
    }

    @PostMapping("/trips/modify")
    public ResponseEntity<com.tripwise.api.dto.ModifyTripResponse> modify(@RequestBody com.tripwise.api.dto.ModifyTripRequest request) {
        return ResponseEntity.ok(tripPlannerService.modify(request));
    }
}
