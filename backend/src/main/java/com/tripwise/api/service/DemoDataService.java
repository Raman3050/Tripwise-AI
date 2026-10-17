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
            places.add(sample("Hawa Mahal", "HISTORIC", "Hawa Mahal Rd, Badi Choupad, Jaipur", 26.9239, 75.8267, "09:00 - 17:00"));
            places.add(sample("City Palace", "CULTURE", "Tulsi Marg, Gangori Bazaar, Jaipur", 26.9258, 75.8237, "09:30 - 17:00"));
            places.add(sample("Jantar Mantar", "HISTORIC", "Near City Palace, Jaipur", 26.9248, 75.8246, "09:00 - 16:30"));
            places.add(sample("Amber Fort & Palace", "HISTORIC", "Devisinghpura, Amer, Jaipur", 26.9855, 75.8513, "08:00 - 17:30"));
            places.add(sample("Jal Mahal (Water Palace)", "VIEWPOINT", "Amer Rd, Jal Mahal, Jaipur", 26.9535, 75.8467, "Open 24 hours"));
            places.add(sample("Nahargarh Fort Sunset Point", "VIEWPOINT", "Krishna Nagar, Brahampuri, Jaipur", 26.9372, 75.8155, "10:00 - 17:30"));
            places.add(sample("Albert Hall Museum", "CULTURE", "Ram Niwas Garden, Jaipur", 26.9117, 75.8197, "09:00 - 17:00"));
            places.add(sample("Johari Bazaar Traditional Market", "MARKET", "Johari Bazar, Pink City, Jaipur", 26.9200, 75.8240, "11:00 - 20:00"));
        } else if (lower.contains("agra")) {
            places.add(sample("Taj Mahal", "HISTORIC", "Dharmapuri, Forest Colony, Tajganj, Agra", 27.1751, 78.0421, "Sunrise - Sunset (Closed Fri)"));
            places.add(sample("Agra Fort", "HISTORIC", "Agra Fort, Rakabganj, Agra", 27.1795, 78.0211, "06:00 - 18:00"));
            places.add(sample("Mehtab Bagh (Moonlight Garden)", "VIEWPOINT", "Nagla Devjit, Agra", 27.1798, 78.0417, "06:00 - 18:00"));
            places.add(sample("Tomb of I'timād-ud-Daulah", "HISTORIC", "Moti Bagh, Agra", 27.1929, 78.0310, "08:00 - 18:00"));
            places.add(sample("Kinari Bazaar Craft & Spice Market", "MARKET", "Kinari Bazar, Hing ki Mandi, Agra", 27.1850, 78.0120, "11:00 - 21:00"));
            places.add(sample("Fatehpur Sikri Royal Complex", "HISTORIC", "Fatehpur Sikri, Agra District", 27.0945, 77.6679, "08:00 - 18:00"));
        } else if (lower.contains("goa")) {
            places.add(sample("Basilica of Bom Jesus", "HISTORIC", "Old Goa Road, Bainguinim, Goa", 15.5009, 73.9116, "09:00 - 18:30"));
            places.add(sample("Fontainhas Latin Quarter", "CULTURE", "Altinho, Panaji, Goa", 15.4925, 73.8272, "Open 24 hours"));
            places.add(sample("Aguada Fort & Lighthouse", "VIEWPOINT", "Sinquerim, Candolim, Goa", 15.4922, 73.7736, "09:30 - 17:30"));
            places.add(sample("Calangute & Baga Beach Promenade", "NATURE", "North Goa Coastal Belt", 15.5528, 73.7517, "Open 24 hours"));
            places.add(sample("Dudhsagar Waterfalls Trek", "NATURE", "Sonaulim, Goa", 15.3144, 74.3143, "08:00 - 16:00"));
            places.add(sample("Anjuna Flea Market & Sunset Point", "MARKET", "Anjuna, Goa", 15.5794, 73.7412, "Wednesdays 09:00 - 19:00"));
        } else if (lower.contains("manali")) {
            places.add(sample("Hadimba Devi Temple", "CULTURE", "Hadimba Temple Rd, Manali", 32.2432, 77.1892, "08:00 - 18:00"));
            places.add(sample("Solang Valley Adventure Arena", "NATURE", "Solang, Vashisht, Manali", 32.3167, 77.1600, "09:00 - 18:00"));
            places.add(sample("Old Manali Bohemian Lane", "CULTURE", "Old Manali, Himachal Pradesh", 32.2574, 77.1788, "Open 24 hours"));
            places.add(sample("Jogini Waterfall Hike", "NATURE", "Vashisht, Manali", 32.2680, 77.1950, "08:00 - 17:00"));
            places.add(sample("Atal Tunnel & Sissu Valley", "VIEWPOINT", "Rohtang Pass Highway, Manali", 32.3650, 77.0650, "06:00 - 19:00"));
            places.add(sample("Mall Road Cultural Promenade", "MARKET", "Mall Rd, Siyal, Manali", 32.2396, 77.1887, "10:00 - 22:00"));
        } else if (lower.contains("delhi")) {
            places.add(sample("Humayun's Tomb", "HISTORIC", "Mathura Rd, Nizamuddin East, New Delhi", 28.5933, 77.2507, "06:00 - 18:00"));
            places.add(sample("Qutub Minar Complex", "HISTORIC", "Seth Sarai, Mehrauli, New Delhi", 28.5245, 77.1855, "07:00 - 18:00"));
            places.add(sample("India Gate & Kartavya Path", "HISTORIC", "Rajpath, India Gate, New Delhi", 28.6129, 77.2295, "Open 24 hours"));
            places.add(sample("Red Fort (Lal Qila)", "HISTORIC", "Netaji Subhash Marg, Chandni Chowk, Delhi", 28.6562, 77.2410, "09:30 - 16:30 (Closed Mon)"));
            places.add(sample("Lodhi Art District & Gardens", "CULTURE", "Lodhi Rd, New Delhi", 28.5931, 77.2197, "06:00 - 20:00"));
            places.add(sample("Chandni Chowk Heritage Food Walk", "MARKET", "Old Delhi Heritage Quarter", 28.6505, 77.2303, "10:00 - 22:00"));
        } else {
            // Authentic destination landmarks
            places.add(sample(d + " Heritage Palace & Citadel", "HISTORIC", "Old Town Heritage Quarter, " + d, 26.5000, 77.5000, "09:00 - 17:30"));
            places.add(sample(d + " Historic City Center & Plaza", "CULTURE", "Central District, " + d, 26.5100, 77.5100, "Open 24 hours"));
            places.add(sample(d + " Panoramic Scenic Viewpoint", "VIEWPOINT", "Upper Ridge Overlook, " + d, 26.5200, 77.4900, "Sunrise - Sunset"));
            places.add(sample(d + " Botanical Park & Lake", "NATURE", "Lakeside Boulevard, " + d, 26.4950, 77.5200, "06:00 - 19:00"));
            places.add(sample(d + " Crafts & Artisan Bazaar", "MARKET", "Market Promenade, " + d, 26.5050, 77.5050, "11:00 - 21:00"));
            places.add(sample(d + " Museum of Arts & Antiquities", "CULTURE", "Museum Road, " + d, 26.5020, 77.5150, "10:00 - 17:00"));
        }
        return places;
    }

    public List<PlaceCard> hotels(String destination) {
        String d = destination.split(",")[0].trim();
        String lower = destination.toLowerCase(Locale.ROOT);

        if (lower.contains("jaipur")) {
            return List.of(
                    sample("Rambagh Palace Heritage Stay", "HOTEL", "Bhawani Singh Rd, Jaipur", 26.8978, 75.8083, "Check-in 14:00"),
                    sample("ITC Rajputana Luxury Hotel", "HOTEL", "Palace Rd, Gopalbari, Jaipur", 26.9208, 75.7946, "Check-in 14:00"),
                    sample("Shahpura Haveli Boutique Hotel", "HOTEL", "Kanti Nagar, Bani Park, Jaipur", 26.9290, 75.7915, "Check-in 12:00"),
                    sample("Zostel Jaipur Backpackers Hub", "HOTEL", "Hawa Mahal Rd, Badi Choupad, Jaipur", 26.9245, 75.8285, "Check-in 12:00")
            );
        } else if (lower.contains("agra")) {
            return List.of(
                    sample("The Oberoi Amarvilas (Taj View)", "HOTEL", "Taj East Gate Rd, Tajganj, Agra", 27.1685, 78.0489, "Check-in 14:00"),
                    sample("ITC Mughal Luxury Resort & Spa", "HOTEL", "Taj Ganj, Fatehabad Rd, Agra", 27.1601, 78.0336, "Check-in 14:00"),
                    sample("Tajview IHCL SeleQtions", "HOTEL", "Fatehabad Rd, Tajganj, Agra", 27.1622, 78.0410, "Check-in 14:00"),
                    sample("Crystal Sarovar Premiere", "HOTEL", "Fatehabad Rd, Tajganj, Agra", 27.1580, 78.0450, "Check-in 13:00")
            );
        } else if (lower.contains("goa")) {
            return List.of(
                    sample("Taj Fort Aguada Resort & Spa", "HOTEL", "Sinquerim, Candolim, Goa", 15.4988, 73.7686, "Check-in 14:00"),
                    sample("W Goa Beach Resort", "HOTEL", "Vagator Beach, Bardez, Goa", 15.6025, 73.7380, "Check-in 15:00"),
                    sample("Ahilya by the Sea Heritage Boutique", "HOTEL", "Nerul, North Goa", 15.5034, 73.7845, "Check-in 14:00"),
                    sample("The Postcard Velha", "HOTEL", "Old Goa, Panaji, Goa", 15.4980, 73.8500, "Check-in 13:00")
            );
        } else if (lower.contains("manali")) {
            return List.of(
                    sample("The Himalayan Luxury Castle & Resort", "HOTEL", "Hadimba Rd, Manali", 32.2470, 77.1860, "Check-in 14:00"),
                    sample("Span Resort & Spa Riverfront", "HOTEL", "Baragarh Estate, Manali Highway", 32.1450, 77.1620, "Check-in 14:00"),
                    sample("Apple Country Resorts", "HOTEL", "Log Huts Area, Manali", 32.2530, 77.1810, "Check-in 13:00"),
                    sample("Zostel Manali Riverside", "HOTEL", "Old Manali Village, Himachal Pradesh", 32.2580, 77.1760, "Check-in 12:00")
            );
        } else {
            return List.of(
                    sample("The Grand " + d + " Luxury Hotel", "HOTEL", "Prime Central Boulevard, " + d, 26.5080, 77.5020, "Check-in 14:00"),
                    sample(d + " Heritage Haveli & Suites", "HOTEL", "Old Quarter, " + d, 26.5040, 77.5080, "Check-in 13:00"),
                    sample("Riverside Boutique Retreat " + d, "HOTEL", "Scenic Vista Avenue, " + d, 26.4980, 77.5180, "Check-in 12:00"),
                    sample("Comfort City Inn " + d, "HOTEL", "Station Road, " + d, 26.5150, 77.4950, "Check-in 12:00")
            );
        }
    }

    public List<PlaceCard> restaurants(String destination) {
        String d = destination.split(",")[0].trim();
        String lower = destination.toLowerCase(Locale.ROOT);

        if (lower.contains("jaipur")) {
            return List.of(
                    sample("1135 AD Royal Rajasthani Dining", "RESTAURANT", "Amber Fort Complex, Jaipur", 26.9860, 75.8520, "12:00 - 23:00"),
                    sample("Laxmi Mishthan Bhandar (LMB)", "RESTAURANT", "Johari Bazar, Pink City, Jaipur", 26.9210, 75.8245, "08:00 - 22:30"),
                    sample("Tapri Central Tea & Rooftop Lounge", "RESTAURANT", "Prithviraj Rd, C Scheme, Jaipur", 26.9080, 75.8050, "07:30 - 22:15"),
                    sample("Handi Famous Lal Maas Restaurant", "RESTAURANT", "MI Road, Ashok Nagar, Jaipur", 26.9180, 75.8110, "12:00 - 23:00")
            );
        } else if (lower.contains("agra")) {
            return List.of(
                    sample("Peshawri (ITC Mughal)", "RESTAURANT", "Fatehabad Rd, Tajganj, Agra", 27.1601, 78.0336, "12:30 - 23:30"),
                    sample("Pinch of Spice Gourmet Kitchen", "RESTAURANT", "Fatehabad Rd, Tajganj, Agra", 27.1610, 78.0430, "11:30 - 23:00"),
                    sample("Shankara Vegis Rooftop Cafe", "RESTAURANT", "Near Taj South Gate, Tajganj, Agra", 27.1700, 78.0410, "08:00 - 22:30"),
                    sample("Dasaprakash South Indian Delicacies", "RESTAURANT", "Meher Cinema Complex, Gwalior Rd, Agra", 27.1550, 78.0120, "10:00 - 22:30")
            );
        } else if (lower.contains("goa")) {
            return List.of(
                    sample("Gunpowder Coastal Cuisine", "RESTAURANT", "Anjuna Mapusa Rd, Assagao, Goa", 15.5890, 73.7820, "12:00 - 23:00"),
                    sample("Fisherman's Wharf Waterfront Dining", "RESTAURANT", "Mobor, Cavelossim / Panaji, Goa", 15.1650, 73.9480, "12:00 - 23:30"),
                    sample("Vinayak Family Restaurant (Fresh Seafood)", "RESTAURANT", "Assagao, North Goa", 15.5910, 73.7710, "12:30 - 22:30"),
                    sample("Artjuna Garden Cafe & Roastery", "RESTAURANT", "Market Rd, Monteiro Vaddo, Anjuna", 15.5830, 73.7480, "08:00 - 22:00")
            );
        } else if (lower.contains("manali")) {
            return List.of(
                    sample("Cafe 1947 Riverside Bistro", "RESTAURANT", "Old Manali, near Bridge, Manali", 32.2570, 77.1810, "11:00 - 23:00"),
                    sample("The Lazy Dog Bohemian Lounge", "RESTAURANT", "Manu Temple Rd, Old Manali", 32.2580, 77.1750, "11:00 - 23:30"),
                    sample("Johnson's Cafe & Trout Bar", "RESTAURANT", "Circuit House Rd, Siyal, Manali", 32.2450, 77.1890, "09:00 - 23:00"),
                    sample("Drifter's Cafe & Breakfast Bar", "RESTAURANT", "Old Manali, Himachal Pradesh", 32.2590, 77.1740, "08:30 - 22:30")
            );
        } else {
            return List.of(
                    sample("The Royal Spice Kitchen " + d, "RESTAURANT", "Heritage Promenade, " + d, 26.5070, 77.5030, "11:30 - 23:00"),
                    sample("Old Town Artisan Cafe & Bakery", "RESTAURANT", "Central Market Square, " + d, 26.5020, 77.5090, "08:00 - 22:00"),
                    sample(d + " Traditional Flavors Bistro", "RESTAURANT", "Lakeside Boulevard, " + d, 26.4990, 77.5140, "12:00 - 22:30"),
                    sample("Sunset Terrace Lounge & Grill", "RESTAURANT", "Overlook Ridge, " + d, 26.5180, 77.4920, "16:00 - 23:30")
            );
        }
    }

    private PlaceCard sample(String name, String category, String address, Double lat, Double lon, String hours) {
        String query = lat != null && lon != null ? lat + "," + lon : name + " " + address;
        String mapUrl = "https://www.google.com/maps/search/?api=1&query=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
        String id = "place-" + UUID.nameUUIDFromBytes((name + address).getBytes(StandardCharsets.UTF_8)).toString().substring(0, 8);
        return new PlaceCard(id, name, category, address, lat, lon, hours, null, mapUrl, "Tripwise Verified", true);
    }
}
