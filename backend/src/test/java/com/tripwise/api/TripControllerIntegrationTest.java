package com.tripwise.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripwise.api.dto.TripRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {"app.geoapify.api-key=", "app.groq.api-key="})
@AutoConfigureMockMvc
class TripControllerIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void healthEndpointReturnsUp() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void planEndpointWorksWithoutPartnerApiKeys() throws Exception {
        LocalDate start = LocalDate.now().plusDays(15);
        TripRequest request = new TripRequest("Delhi, India", "Jaipur, India", start,
                start.plusDays(2), 2, 30000, "balanced", "cheapest", List.of("Culture", "Food"));
        mockMvc.perform(post("/api/trips/plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataMode").value("DEMO_DATA"))
                .andExpect(jsonPath("$.aiMode").value("RULE_BASED"))
                .andExpect(jsonPath("$.itinerary.length()").value(3))
                .andExpect(jsonPath("$.bookingLinks.length()").value(6));
    }
}
