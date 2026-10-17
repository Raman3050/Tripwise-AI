package com.tripwise.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripwise.api.dto.SavedTripSummaryDto;
import com.tripwise.api.dto.TripPlanResponse;
import com.tripwise.api.model.SavedTrip;
import com.tripwise.api.model.User;
import com.tripwise.api.repository.SavedTripRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SavedTripService {
    private static final Logger log = LoggerFactory.getLogger(SavedTripService.class);
    private final SavedTripRepository savedTripRepository;
    private final ObjectMapper objectMapper;

    public SavedTripService(SavedTripRepository savedTripRepository, ObjectMapper objectMapper) {
        this.savedTripRepository = savedTripRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SavedTripSummaryDto saveTrip(User user, TripPlanResponse plan) {
        if (plan == null || plan.trip() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip plan cannot be null.");
        }

        try {
            String planJson = objectMapper.writeValueAsString(plan);
            String origin = plan.trip().origin();
            String destination = plan.trip().destination();

            // Check if user already saved this route
            List<SavedTrip> existing = savedTripRepository.findByUserIdAndOriginIgnoreCaseAndDestinationIgnoreCase(
                    user.getId(), origin, destination
            );

            SavedTrip savedTrip;
            if (!existing.isEmpty()) {
                // Update existing route record
                savedTrip = existing.get(0);
                savedTrip.setStartDate(plan.trip().startDate());
                savedTrip.setEndDate(plan.trip().endDate());
                savedTrip.setTravelers(plan.trip().travelers());
                savedTrip.setBudgetInr(plan.trip().budgetInr());
                savedTrip.setTotalCostInr(plan.costEstimate() != null ? plan.costEstimate().totalInr() : plan.trip().budgetInr());
                savedTrip.setSummary(plan.summary());
                savedTrip.setPlanJson(planJson);
                savedTrip.setUpdatedAt(Instant.now());
                log.info("Updated existing itinerary for user {} route: {} -> {}", user.getEmail(), origin, destination);
            } else {
                // Insert new route record
                int totalCost = plan.costEstimate() != null ? plan.costEstimate().totalInr() : plan.trip().budgetInr();
                savedTrip = new SavedTrip(
                        user, origin, destination, plan.trip().startDate(), plan.trip().endDate(),
                        plan.trip().travelers(), plan.trip().budgetInr(), totalCost, plan.summary(), planJson
                );
                log.info("Created new itinerary record for user {} route: {} -> {}", user.getEmail(), origin, destination);
            }

            savedTrip = savedTripRepository.save(savedTrip);

            return new SavedTripSummaryDto(
                    savedTrip.getId(), savedTrip.getOrigin(), savedTrip.getDestination(),
                    savedTrip.getStartDate(), savedTrip.getEndDate(), savedTrip.getTravelers(),
                    savedTrip.getBudgetInr(), savedTrip.getTotalCostInr(), savedTrip.getSummary(),
                    savedTrip.getCreatedAt()
            );
        } catch (Exception e) {
            log.error("Failed to serialize or save trip itinerary: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save trip to database: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<SavedTripSummaryDto> getUserTrips(User user) {
        return savedTripRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(t -> new SavedTripSummaryDto(
                        t.getId(), t.getOrigin(), t.getDestination(),
                        t.getStartDate(), t.getEndDate(), t.getTravelers(),
                        t.getBudgetInr(), t.getTotalCostInr(), t.getSummary(),
                        t.getCreatedAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public TripPlanResponse getTripDetails(User user, UUID tripId) {
        SavedTrip trip = savedTripRepository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved trip not found."));

        try {
            return objectMapper.readValue(trip.getPlanJson(), TripPlanResponse.class);
        } catch (Exception e) {
            log.error("Failed to deserialize saved trip JSON: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read saved trip data.");
        }
    }

    @Transactional
    public void deleteTrip(User user, UUID tripId) {
        SavedTrip trip = savedTripRepository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved trip not found."));
        savedTripRepository.delete(trip);
        log.info("Deleted saved trip {} for user {}", tripId, user.getEmail());
    }
}
