package com.tripwise.api.service;

import com.tripwise.api.dto.TripPlanResponse.PlaceCard;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class DemoDataService {
    public List<PlaceCard> attractions(String destination) {
        String d = destination.split(",")[0].trim();
        List<PlaceCard> places = new ArrayList<>();
        String lower = destination.toLowerCase(Locale.ROOT);
        if (lower.contains("jaipur")) {
            places.add(sample("Hawa Mahal", "ATTRACTION", "Jaipur, Rajasthan", 26.9239, 75.8267));
            places.add(sample("City Palace", "ATTRACTION", "Jaipur, Rajasthan", 26.9258, 75.8237));
            places.add(sample("Jantar Mantar", "ATTRACTION", "Jaipur, Rajasthan", 26.9248, 75.8246));
            places.add(sample("Amber Fort", "ATTRACTION", "Amer, Jaipur, Rajasthan", 26.9855, 75.8513));
            places.add(sample("Jal Mahal", "ATTRACTION", "Jaipur, Rajasthan", 26.9535, 75.8467));
            places.add(sample("Albert Hall Museum", "ATTRACTION", "Jaipur, Rajasthan", 26.9117, 75.8197));
        } else if (lower.contains("goa")) {
            places.add(sample("Old Goa Heritage Area", "ATTRACTION", "Goa, India", 15.5009, 73.9116));
            places.add(sample("Fontainhas Latin Quarter", "ATTRACTION", "Panaji, Goa", 15.4925, 73.8272));
            places.add(sample("Miramar Beach", "ATTRACTION", "Panaji, Goa", 15.4779, 73.8071));
            places.add(sample("Dona Paula Viewpoint", "ATTRACTION", "Goa, India", 15.4562, 73.8031));
        } else if (lower.contains("manali")) {
            places.add(sample("Hadimba Devi Temple", "ATTRACTION", "Manali, Himachal Pradesh", 32.2432, 77.1892));
            places.add(sample("Old Manali", "ATTRACTION", "Manali, Himachal Pradesh", 32.2574, 77.1788));
            places.add(sample("Manu Temple", "ATTRACTION", "Old Manali, Himachal Pradesh", 32.2584, 77.1748));
            places.add(sample("Solang Valley", "ATTRACTION", "Near Manali, Himachal Pradesh", 32.3167, 77.1600));
        } else if (lower.contains("agra")) {
            places.add(sample("Taj Mahal", "ATTRACTION", "Agra, Uttar Pradesh", 27.1751, 78.0421));
            places.add(sample("Agra Fort", "ATTRACTION", "Agra, Uttar Pradesh", 27.1795, 78.0211));
            places.add(sample("Mehtab Bagh", "ATTRACTION", "Agra, Uttar Pradesh", 27.1798, 78.0417));
        } else if (lower.contains("delhi")) {
            places.add(sample("Humayun's Tomb", "ATTRACTION", "New Delhi, India", 28.5933, 77.2507));
            places.add(sample("Qutub Minar", "ATTRACTION", "New Delhi, India", 28.5245, 77.1855));
            places.add(sample("India Gate", "ATTRACTION", "New Delhi, India", 28.6129, 77.2295));
            places.add(sample("Lodhi Garden", "ATTRACTION", "New Delhi, India", 28.5931, 77.2197));
        } else {
            places.add(sample("Historic centre of " + d, "ATTRACTION", d, null, null));
            places.add(sample("Local culture & heritage walk", "ATTRACTION", d, null, null));
            places.add(sample("Popular viewpoints around " + d, "ATTRACTION", d, null, null));
            places.add(sample("Local market exploration", "ATTRACTION", d, null, null));
        }
        return places;
    }

    public List<PlaceCard> hotels(String destination) {
        String d = destination.split(",")[0].trim();
        return List.of(
                sample("Budget stay area — " + d + " (sample)", "HOTEL", "Search stays near the city centre", null, null),
                sample("Comfort stay area — " + d + " (sample)", "HOTEL", "Search well-connected neighbourhoods", null, null),
                sample("Boutique stay area — " + d + " (sample)", "HOTEL", "Search locally owned accommodation", null, null)
        );
    }

    public List<PlaceCard> restaurants(String destination) {
        String d = destination.split(",")[0].trim();
        return List.of(
                sample("Local cuisine near " + d + " (search suggestion)", "RESTAURANT", d, null, null),
                sample("Casual café near the centre (search suggestion)", "RESTAURANT", d, null, null),
                sample("Popular dinner spots in " + d + " (search suggestion)", "RESTAURANT", d, null, null)
        );
    }

    private PlaceCard sample(String name, String category, String address, Double lat, Double lon) {
        String query = lat != null && lon != null ? lat + "," + lon : name + " " + address;
        String mapUrl = "https://www.google.com/maps/search/?api=1&query=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
        String id = UUID.nameUUIDFromBytes((name + address).getBytes(StandardCharsets.UTF_8)).toString();
        return new PlaceCard(id, name, category, address, lat, lon, null, null, mapUrl, "Sample data", false);
    }
}
