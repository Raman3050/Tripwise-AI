package com.tripwise.api.controller;

import com.tripwise.api.dto.SaveTripRequest;
import com.tripwise.api.dto.SavedTripSummaryDto;
import com.tripwise.api.dto.TripPlanResponse;
import com.tripwise.api.model.User;
import com.tripwise.api.service.AuthService;
import com.tripwise.api.service.SavedTripService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user/trips")
public class SavedTripController {
    private final SavedTripService savedTripService;
    private final AuthService authService;

    public SavedTripController(SavedTripService savedTripService, AuthService authService) {
        this.savedTripService = savedTripService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<SavedTripSummaryDto> saveTrip(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody SaveTripRequest request) {
        User user = authService.resolveUser(authHeader);
        return ResponseEntity.ok(savedTripService.saveTrip(user, request.plan()));
    }

    @GetMapping
    public ResponseEntity<List<SavedTripSummaryDto>> listUserTrips(
            @RequestHeader("Authorization") String authHeader) {
        User user = authService.resolveUser(authHeader);
        return ResponseEntity.ok(savedTripService.getUserTrips(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripPlanResponse> getTripDetails(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id) {
        User user = authService.resolveUser(authHeader);
        return ResponseEntity.ok(savedTripService.getTripDetails(user, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTrip(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id) {
        User user = authService.resolveUser(authHeader);
        savedTripService.deleteTrip(user, id);
        return ResponseEntity.ok(Map.of("message", "Saved trip deleted successfully", "id", id.toString()));
    }
}
