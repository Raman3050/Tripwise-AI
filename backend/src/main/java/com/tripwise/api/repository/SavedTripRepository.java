package com.tripwise.api.repository;

import com.tripwise.api.model.SavedTrip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedTripRepository extends JpaRepository<SavedTrip, UUID> {
    List<SavedTrip> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<SavedTrip> findByUserIdAndOriginIgnoreCaseAndDestinationIgnoreCase(UUID userId, String origin, String destination);
    Optional<SavedTrip> findByIdAndUserId(UUID id, UUID userId);
}
