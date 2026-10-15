package com.helpdesk360.service;

import com.helpdesk360.dto.*;
import com.helpdesk360.model.StatusHistory;
import com.helpdesk360.model.Ticket;
import com.helpdesk360.model.User;
import com.helpdesk360.repository.StatusHistoryRepository;
import com.helpdesk360.repository.TicketRepository;
import com.helpdesk360.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final StatusHistoryRepository statusHistoryRepository;

    // Valid status transitions
    private static final java.util.Map<Ticket.Status, Set<Ticket.Status>> VALID_TRANSITIONS = java.util.Map.of(
        Ticket.Status.OPEN, Set.of(Ticket.Status.IN_PROGRESS, Ticket.Status.CLOSED),
        Ticket.Status.IN_PROGRESS, Set.of(Ticket.Status.RESOLVED, Ticket.Status.OPEN, Ticket.Status.CLOSED),
        Ticket.Status.RESOLVED, Set.of(Ticket.Status.CLOSED, Ticket.Status.OPEN),
        Ticket.Status.CLOSED, Set.of(Ticket.Status.OPEN)
    );

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository,
                         StatusHistoryRepository statusHistoryRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.statusHistoryRepository = statusHistoryRepository;
    }

    @Transactional
    public TicketDTO createTicket(CreateTicketRequest request, User reporter) {
        // Sanitize inputs
        String title = HtmlUtils.htmlEscape(request.getTitle().trim());
        String description = HtmlUtils.htmlEscape(request.getDescription().trim());

        // Validate enums
        Ticket.Category category;
        Ticket.Priority priority;
        try {
            category = Ticket.Category.valueOf(request.getCategory().toUpperCase().replace("-", "_"));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid category: " + request.getCategory() +
                ". Valid values: HARDWARE, NETWORK, SOFTWARE, ACCOUNT_ACCESS");
        }
        try {
            priority = Ticket.Priority.valueOf(request.getPriority().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid priority: " + request.getPriority() +
                ". Valid values: LOW, MEDIUM, HIGH, URGENT");
        }

        Ticket ticket = new Ticket();
        ticket.setTitle(title);
        ticket.setDescription(description);
        ticket.setCategory(category);
        ticket.setPriority(priority);
        ticket.setStatus(Ticket.Status.OPEN);
        ticket.setReportedBy(reporter);

        ticket = ticketRepository.save(ticket);

        // Record initial status in history
        StatusHistory history = new StatusHistory(ticket, reporter, null, Ticket.Status.OPEN);
        statusHistoryRepository.save(history);

        return TicketDTO.fromEntity(ticket);
    }

    public List<TicketDTO> getTicketsByReporter(User reporter) {
        return ticketRepository.findByReportedByOrderByCreatedAtDesc(reporter)
                .stream()
                .map(TicketDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<TicketDTO> getAllTicketsSorted() {
        return ticketRepository.findAllOrderByPriorityAndDate()
                .stream()
                .map(TicketDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public TicketDTO getTicketById(Long ticketId, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        // Employees can only see their own tickets
        if (currentUser.getRole() == User.Role.EMPLOYEE &&
            !ticket.getReportedBy().getId().equals(currentUser.getId())) {
            throw new SecurityException("Access denied: you can only view your own tickets");
        }

        return TicketDTO.fromEntity(ticket);
    }

    @Transactional
    public TicketDTO updateTicket(Long ticketId, UpdateTicketRequest request, User technician) {
        // Only technicians can update tickets
        if (technician.getRole() != User.Role.TECHNICIAN) {
            throw new SecurityException("Access denied: only technicians can update tickets");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        // Handle assignment
        if (request.getAssignedTo() != null) {
            User assignee = userRepository.findById(request.getAssignedTo())
                    .orElseThrow(() -> new IllegalArgumentException("Assigned user not found"));
            if (assignee.getRole() != User.Role.TECHNICIAN) {
                throw new IllegalArgumentException("Can only assign tickets to technicians");
            }
            ticket.setAssignedTo(assignee);
        }

        // Handle status update
        if (request.getStatus() != null) {
            Ticket.Status newStatus;
            try {
                newStatus = Ticket.Status.valueOf(request.getStatus().toUpperCase().replace("-", "_"));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status: " + request.getStatus() +
                    ". Valid values: OPEN, IN_PROGRESS, RESOLVED, CLOSED");
            }

            Ticket.Status oldStatus = ticket.getStatus();

            // Validate status transition
            Set<Ticket.Status> validNext = VALID_TRANSITIONS.get(oldStatus);
            if (validNext == null || !validNext.contains(newStatus)) {
                throw new IllegalArgumentException(
                    "Invalid status transition from " + oldStatus + " to " + newStatus);
            }

            ticket.setStatus(newStatus);

            // Record status change
            StatusHistory history = new StatusHistory(ticket, technician, oldStatus, newStatus);
            statusHistoryRepository.save(history);
        }

        ticket = ticketRepository.save(ticket);
        return TicketDTO.fromEntity(ticket);
    }

    public List<StatusHistoryDTO> getTicketHistory(Long ticketId, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        // Employees can only see history of their own tickets
        if (currentUser.getRole() == User.Role.EMPLOYEE &&
            !ticket.getReportedBy().getId().equals(currentUser.getId())) {
            throw new SecurityException("Access denied");
        }

        return statusHistoryRepository.findByTicketIdOrderByChangedAtAsc(ticketId)
                .stream()
                .map(StatusHistoryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public DashboardDTO getDashboardMetrics() {
        DashboardDTO dto = new DashboardDTO();
        dto.setTotalTickets(ticketRepository.count());
        dto.setOpenTickets(ticketRepository.countByStatus(Ticket.Status.OPEN));
        dto.setInProgressTickets(ticketRepository.countByStatus(Ticket.Status.IN_PROGRESS));
        dto.setResolvedTickets(ticketRepository.countByStatus(Ticket.Status.RESOLVED));
        dto.setClosedTickets(ticketRepository.countByStatus(Ticket.Status.CLOSED));
        dto.setUrgentTickets(ticketRepository.countByPriority(Ticket.Priority.URGENT));
        dto.setHighPriorityTickets(ticketRepository.countByPriority(Ticket.Priority.HIGH));
        dto.setAssignedTickets(ticketRepository.countByAssignedToIsNotNull());
        dto.setCompletedTickets(ticketRepository.countCompleted());
        dto.setOpenUrgentTickets(ticketRepository.countOpenUrgent());
        return dto;
    }

    public List<TicketDTO> filterTickets(String status, String priority, String category) {
        List<Ticket> tickets;

        if (status != null && !status.isEmpty()) {
            tickets = ticketRepository.findByStatusOrderByCreatedAtDesc(
                Ticket.Status.valueOf(status.toUpperCase().replace("-", "_")));
        } else if (priority != null && !priority.isEmpty()) {
            tickets = ticketRepository.findByPriorityOrderByCreatedAtDesc(
                Ticket.Priority.valueOf(priority.toUpperCase()));
        } else if (category != null && !category.isEmpty()) {
            tickets = ticketRepository.findByCategoryOrderByCreatedAtDesc(
                Ticket.Category.valueOf(category.toUpperCase().replace("-", "_")));
        } else {
            tickets = ticketRepository.findAllOrderByPriorityAndDate();
        }

        return tickets.stream().map(TicketDTO::fromEntity).collect(Collectors.toList());
    }
}
