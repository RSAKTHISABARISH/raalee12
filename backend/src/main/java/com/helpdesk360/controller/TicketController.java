package com.helpdesk360.controller;

import com.helpdesk360.dto.*;
import com.helpdesk360.model.User;
import com.helpdesk360.service.TicketService;
import com.helpdesk360.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final UserService userService;

    public TicketController(TicketService ticketService, UserService userService) {
        this.ticketService = ticketService;
        this.userService = userService;
    }

    /**
     * Create a new ticket (any authenticated user)
     */
    @PostMapping
    public ResponseEntity<?> createTicket(@Valid @RequestBody CreateTicketRequest request,
                                          @AuthenticationPrincipal User currentUser) {
        try {
            TicketDTO ticket = ticketService.createTicket(request, currentUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get current user's tickets (employees see only their own)
     */
    @GetMapping("/my")
    public ResponseEntity<List<TicketDTO>> getMyTickets(@AuthenticationPrincipal User currentUser) {
        List<TicketDTO> tickets = ticketService.getTicketsByReporter(currentUser);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get all tickets - technicians only
     */
    @GetMapping
    public ResponseEntity<?> getAllTickets(@AuthenticationPrincipal User currentUser,
                                          @RequestParam(required = false) String status,
                                          @RequestParam(required = false) String priority,
                                          @RequestParam(required = false) String category) {
        if (currentUser.getRole() != User.Role.TECHNICIAN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: technicians only"));
        }
        try {
            List<TicketDTO> tickets = ticketService.filterTickets(status, priority, category);
            return ResponseEntity.ok(tickets);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get a specific ticket by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTicket(@PathVariable Long id,
                                       @AuthenticationPrincipal User currentUser) {
        try {
            TicketDTO ticket = ticketService.getTicketById(id, currentUser);
            return ResponseEntity.ok(ticket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update a ticket (technicians only) - assign or change status
     */
    @PatchMapping("/{id}")
    public ResponseEntity<?> updateTicket(@PathVariable Long id,
                                          @RequestBody UpdateTicketRequest request,
                                          @AuthenticationPrincipal User currentUser) {
        try {
            TicketDTO ticket = ticketService.updateTicket(id, request, currentUser);
            return ResponseEntity.ok(ticket);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get ticket status history
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<?> getTicketHistory(@PathVariable Long id,
                                              @AuthenticationPrincipal User currentUser) {
        try {
            List<StatusHistoryDTO> history = ticketService.getTicketHistory(id, currentUser);
            return ResponseEntity.ok(history);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get dashboard metrics
     */
    @GetMapping("/dashboard/metrics")
    public ResponseEntity<DashboardDTO> getDashboardMetrics() {
        return ResponseEntity.ok(ticketService.getDashboardMetrics());
    }
}
