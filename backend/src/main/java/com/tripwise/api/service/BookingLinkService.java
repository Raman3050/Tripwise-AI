package com.tripwise.api.service;

import com.tripwise.api.dto.TripPlanResponse.BookingLink;
import com.tripwise.api.dto.TripRequest;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingLinkService {
    public List<BookingLink> createLinks(TripRequest trip) {
        String origin = trip.origin();
        String destination = trip.destination();
        String dates = trip.startDate() + " to " + trip.endDate();
        String flightQuery = "Flights from " + origin + " to " + destination + " " + dates + " " + trip.travelers() + " travelers";
        String hotelQuery = "Hotels in " + destination + " check in " + trip.startDate() + " check out " + trip.endDate() + " for " + trip.travelers() + " guests";
        String attractionQuery = "Attraction tickets and experiences in " + destination + " " + dates;
        String mapUrl = "https://www.google.com/maps/dir/?api=1&origin=" + encode(origin)
                + "&destination=" + encode(destination) + "&travelmode=driving";
        List<BookingLink> links = new ArrayList<>();
        links.add(new BookingLink("Search flights", "Compare current fares and times", "https://www.google.com/travel/flights?q=" + encode(flightQuery), "FLIGHT"));
        links.add(new BookingLink("Search trains", "Check IRCTC schedules, fares and seats", "https://www.irctc.co.in/nget/train-search", "TRAIN"));
        links.add(new BookingLink("Search buses", "Check available intercity bus operators", "https://www.redbus.in/", "BUS"));
        links.add(new BookingLink("Find stays", "Search accommodation for your travel dates", "https://www.google.com/search?q=" + encode(hotelQuery), "HOTEL"));
        links.add(new BookingLink("Explore tickets", "Find attraction tickets and local experiences", "https://www.google.com/search?q=" + encode(attractionQuery), "TICKETS"));
        links.add(new BookingLink("Open route in Maps", "Review the origin-to-destination route", mapUrl, "MAP"));
        return links;
    }

    public String mapUrl(TripRequest trip) {
        return "https://www.google.com/maps/dir/?api=1&origin=" + encode(trip.origin())
                + "&destination=" + encode(trip.destination()) + "&travelmode=driving";
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
