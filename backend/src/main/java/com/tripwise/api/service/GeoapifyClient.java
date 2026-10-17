package com.tripwise.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.tripwise.api.dto.TripPlanResponse.PlaceCard;
import com.tripwise.api.dto.TripRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class GeoapifyClient {
    private static final Logger log = LoggerFactory.getLogger(GeoapifyClient.class);
    private final RestClient restClient = RestClient.builder().build();

    @Value("${app.geoapify.api-key:}")
    private String apiKey;

    public Optional<LiveSnapshot> fetchTripData(TripRequest request) {
        if (apiKey == null || apiKey.isBlank()) return Optional.empty();
        try {
            Optional<GeoPoint> origin = geocode(request.origin());
            Optional<GeoPoint> destination = geocode(request.destination());
            if (origin.isEmpty() || destination.isEmpty()) {
                log.warn("Geoapify could not geocode origin/destination; using demo data");
                return Optional.empty();
            }

            GeoPoint destinationPoint = destination.get();
            List<PlaceCard> attractions = fetchPlaces(destinationPoint,
                    "tourism.sights,tourism.attraction,entertainment.museum,heritage", "ATTRACTION");
            List<PlaceCard> restaurants = fetchPlaces(destinationPoint,
                    "catering.restaurant,catering.cafe", "RESTAURANT");
            List<PlaceCard> hotels = fetchPlaces(destinationPoint,
                    "accommodation.hotel,accommodation.guest_house,accommodation.hostel", "HOTEL");

            Double distanceKm = null;
            Integer drivingMinutes = null;
            try {
                JsonNode route = restClient.get().uri(uriBuilder -> uriBuilder
                                .scheme("https").host("api.geoapify.com").path("/v1/routing")
                                .queryParam("waypoints", origin.get().latitude() + "," + origin.get().longitude()
                                        + "|" + destinationPoint.latitude() + "," + destinationPoint.longitude())
                                .queryParam("mode", "drive")
                                .queryParam("apiKey", apiKey)
                                .build())
                        .retrieve().body(JsonNode.class);
                JsonNode properties = route == null ? null : route.path("features").path(0).path("properties");
                if (properties != null && properties.hasNonNull("distance") && properties.hasNonNull("time")) {
                    distanceKm = Math.round(properties.path("distance").asDouble() / 100.0) / 10.0;
                    drivingMinutes = (int) Math.round(properties.path("time").asDouble() / 60.0);
                }
            } catch (Exception ex) {
                log.info("Route lookup did not complete; trip will keep estimate labels: {}", ex.getMessage());
            }
            return Optional.of(new LiveSnapshot(origin.get(), destinationPoint, attractions, hotels,
                    restaurants, distanceKm, drivingMinutes));
        } catch (Exception ex) {
            log.warn("Geoapify request failed; switching to demo data: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private Optional<GeoPoint> geocode(String text) {
        JsonNode response = restClient.get().uri(uriBuilder -> uriBuilder
                        .scheme("https").host("api.geoapify.com").path("/v1/geocode/search")
                        .queryParam("text", text)
                        .queryParam("limit", 1)
                        .queryParam("apiKey", apiKey)
                        .build())
                .retrieve().body(JsonNode.class);
        JsonNode first = response == null ? null : response.path("results").path(0);
        if (first == null || first.isMissingNode() || !first.hasNonNull("lat") || !first.hasNonNull("lon")) {
            return Optional.empty();
        }
        return Optional.of(new GeoPoint(first.path("lat").asDouble(), first.path("lon").asDouble()));
    }

    private List<PlaceCard> fetchPlaces(GeoPoint point, String categories, String kind) {
        try {
            JsonNode response = restClient.get().uri(uriBuilder -> uriBuilder
                            .scheme("https").host("api.geoapify.com").path("/v2/places")
                            .queryParam("categories", categories)
                            .queryParam("filter", "circle:" + point.longitude() + "," + point.latitude() + ",18000")
                            .queryParam("bias", "proximity:" + point.longitude() + "," + point.latitude())
                            .queryParam("limit", 12)
                            .queryParam("apiKey", apiKey)
                            .build())
                    .retrieve().body(JsonNode.class);
            List<PlaceCard> places = new ArrayList<>();
            JsonNode features = response == null ? null : response.path("features");
            if (features != null && features.isArray()) {
                for (JsonNode feature : features) {
                    JsonNode p = feature.path("properties");
                    String name = firstText(p.path("name").asText(""), p.path("address_line1").asText(""));
                    if (name.isBlank()) continue;
                    String address = firstText(p.path("formatted").asText(""), p.path("address_line2").asText(""));
                    Double lat = p.hasNonNull("lat") ? p.path("lat").asDouble() : null;
                    Double lon = p.hasNonNull("lon") ? p.path("lon").asDouble() : null;
                    String website = firstText(p.path("website").asText(""), p.path("datasource").path("raw").path("website").asText(""));
                    String hours = p.path("opening_hours").asText("");
                    String externalId = firstText(p.path("place_id").asText(""), name + address);
                    String id = UUID.nameUUIDFromBytes(externalId.getBytes(StandardCharsets.UTF_8)).toString();
                    String mapQuery = lat != null && lon != null ? lat + "," + lon : name + " " + address;
                    String mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encode(mapQuery);
                    places.add(new PlaceCard(id, name, kind, address, lat, lon,
                            hours.isBlank() ? null : hours, website.isBlank() ? null : website,
                            mapUrl, "Geoapify", true));
                }
            }
            // Preserve provider order while removing duplicates by display name.
            Map<String, PlaceCard> unique = new LinkedHashMap<>();
            for (PlaceCard place : places) unique.putIfAbsent(place.name().toLowerCase(), place);
            return new ArrayList<>(unique.values());
        } catch (Exception ex) {
            log.warn("Geoapify {} search failed: {}", kind, ex.getMessage());
            return List.of();
        }
    }

    private static String firstText(String a, String b) {
        return a != null && !a.isBlank() ? a : (b == null ? "" : b);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    public record GeoPoint(double latitude, double longitude) {}
    public record LiveSnapshot(GeoPoint origin, GeoPoint destination,
                               List<PlaceCard> attractions, List<PlaceCard> hotels,
                               List<PlaceCard> restaurants, Double distanceKm,
                               Integer drivingMinutes) {}
}
