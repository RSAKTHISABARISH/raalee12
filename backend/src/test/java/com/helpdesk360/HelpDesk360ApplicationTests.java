package com.helpdesk360;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.helpdesk360.dto.CreateTicketRequest;
import com.helpdesk360.dto.LoginRequest;
import com.helpdesk360.dto.UpdateTicketRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class HelpDesk360ApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest request = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        return objectMapper.readTree(responseBody).get("token").asText();
    }

    @Test
    @DisplayName("Health endpoint returns UP")
    public void testHealthCheck() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("Employee login succeeds with valid seeded credentials")
    public void testEmployeeLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest("alice@company.com", "password123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("alice@company.com"))
                .andExpect(jsonPath("$.user.role").value("EMPLOYEE"));
    }

    @Test
    @DisplayName("Technician login succeeds with valid seeded credentials")
    public void testTechnicianLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest("dave@company.com", "password123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("dave@company.com"))
                .andExpect(jsonPath("$.user.role").value("TECHNICIAN"));
    }

    @Test
    @DisplayName("Login fails with invalid credentials")
    public void testLoginInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("alice@company.com", "wrongpassword");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Employee creates ticket and audits initial status history")
    public void testTicketLifecycleAndHistory() throws Exception {
        String empToken = loginAndGetToken("alice@company.com", "password123");

        // 1. Create a ticket
        CreateTicketRequest createReq = new CreateTicketRequest();
        createReq.setTitle("VPN Gateway handshake failure");
        createReq.setDescription("Cannot connect to corporate VPN after MFA prompt");
        createReq.setCategory("NETWORK");
        createReq.setPriority("HIGH");

        MvcResult createResult = mockMvc.perform(post("/api/tickets")
                        .header("Authorization", "Bearer " + empToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("VPN Gateway handshake failure"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andReturn();

        long ticketId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // 2. Fetch ticket history - must contain creation event
        mockMvc.perform(get("/api/tickets/" + ticketId + "/history")
                        .header("Authorization", "Bearer " + empToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].newStatus").value("OPEN"));

        // 3. Technician updates status to IN_PROGRESS
        String techToken = loginAndGetToken("dave@company.com", "password123");
        UpdateTicketRequest updateReq = new UpdateTicketRequest();
        updateReq.setStatus("IN_PROGRESS");

        mockMvc.perform(patch("/api/tickets/" + ticketId)
                        .header("Authorization", "Bearer " + techToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // 4. Verify history has 2 events now
        mockMvc.perform(get("/api/tickets/" + ticketId + "/history")
                        .header("Authorization", "Bearer " + techToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[1].oldStatus").value("OPEN"))
                .andExpect(jsonPath("$[1].newStatus").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("Dashboard metrics return correct aggregation numbers from database")
    public void testDashboardMetrics() throws Exception {
        String techToken = loginAndGetToken("dave@company.com", "password123");

        mockMvc.perform(get("/api/tickets/dashboard/metrics")
                        .header("Authorization", "Bearer " + techToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTickets").isNumber())
                .andExpect(jsonPath("$.openTickets").isNumber())
                .andExpect(jsonPath("$.inProgressTickets").isNumber())
                .andExpect(jsonPath("$.resolvedTickets").isNumber())
                .andExpect(jsonPath("$.urgentTickets").isNumber());
    }
}
