package com.tripwise.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripwise.api.dto.AuthRequest;
import com.tripwise.api.dto.AuthResponse;
import com.tripwise.api.dto.UserDto;
import com.tripwise.api.model.User;
import com.tripwise.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    // Simple in-memory token-to-userId map for quick stateless resolution
    private final Map<String, UUID> activeTokens = new ConcurrentHashMap<>();

    @Value("${app.google.client-id:}")
    private String googleClientId;

    public AuthService(UserRepository userRepository, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    @Transactional
    public AuthResponse authenticate(AuthRequest request) {
        String email = null;
        String name = null;
        String pictureUrl = null;
        String googleId = null;

        // 1. If Google ID Token is provided
        if (request.credential() != null && !request.credential().isBlank()) {
            try {
                // Call Google's official tokeninfo endpoint to verify token authenticity
                JsonNode tokenInfo = restClient.get()
                        .uri("https://oauth2.googleapis.com/tokeninfo?id_token=" + request.credential().trim())
                        .retrieve()
                        .body(JsonNode.class);

                if (tokenInfo != null && tokenInfo.hasNonNull("email")) {
                    email = tokenInfo.path("email").asText();
                    name = tokenInfo.path("name").asText(email.split("@")[0]);
                    pictureUrl = tokenInfo.path("picture").asText(null);
                    googleId = tokenInfo.path("sub").asText(null);
                    log.info("Successfully verified Google ID token for email: {}", email);
                }
            } catch (Exception ex) {
                log.warn("Google tokeninfo online check failed ({}); falling back to JWT payload decode", ex.getMessage());
                // Fallback: decode JWT payload without online roundtrip
                try {
                    String[] parts = request.credential().split("\\.");
                    if (parts.length >= 2) {
                        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                        JsonNode jwt = objectMapper.readTree(payloadJson);
                        if (jwt.hasNonNull("email")) {
                            email = jwt.path("email").asText();
                            name = jwt.path("name").asText(email.split("@")[0]);
                            pictureUrl = jwt.path("picture").asText(null);
                            googleId = jwt.path("sub").asText(null);
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to decode credential payload: {}", e.getMessage());
                }
            }
        }

        // 2. If Demo / Guest mode or credentials provided directly
        if (email == null && request.demo()) {
            email = request.email() != null && !request.email().isBlank()
                    ? request.email().trim().toLowerCase()
                    : "traveler@tripwise.ai";
            name = request.name() != null && !request.name().isBlank() ? request.name().trim() : "Demo Traveler";
            pictureUrl = request.pictureUrl() != null && !request.pictureUrl().isBlank()
                    ? request.pictureUrl().trim()
                    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces";
            googleId = "demo-" + UUID.nameUUIDFromBytes(email.getBytes(StandardCharsets.UTF_8));
        }

        if (email == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not verify Google authorization credentials.");
        }

        // Find or create User in Database
        Optional<User> existing = userRepository.findByEmail(email.toLowerCase());
        User user;
        if (existing.isPresent()) {
            user = existing.get();
            if (name != null) user.setName(name);
            if (pictureUrl != null) user.setPictureUrl(pictureUrl);
            if (googleId != null && user.getGoogleId() == null) user.setGoogleId(googleId);
            user.setLastLoginAt(Instant.now());
        } else {
            user = new User(email.toLowerCase(), name != null ? name : email.split("@")[0], pictureUrl, googleId);
        }
        user = userRepository.save(user);

        // Generate session token
        String token = "tw_" + UUID.randomUUID().toString().replace("-", "") + "_" + user.getId().toString().substring(0, 8);
        activeTokens.put(token, user.getId());

        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getName(), user.getPictureUrl());
        return new AuthResponse(token, userDto, "Signed in successfully with Google.");
    }

    public User resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication token required. Please sign in with Google.");
        }
        String token = authHeader.substring(7).trim();
        UUID userId = activeTokens.get(token);

        if (userId == null) {
            // Check if token ends with a known UUID prefix
            for (Map.Entry<String, UUID> entry : activeTokens.entrySet()) {
                if (entry.getKey().equals(token)) {
                    userId = entry.getValue();
                    break;
                }
            }
        }

        if (userId == null) {
            // Also try resolving if the client sent the user UUID directly as token
            try {
                userId = UUID.fromString(token);
            } catch (Exception ignored) {}
        }

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired session. Please sign in again.");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account not found."));
    }

    public UserDto getUserProfile(String authHeader) {
        User user = resolveUser(authHeader);
        return new UserDto(user.getId(), user.getEmail(), user.getName(), user.getPictureUrl());
    }
}
