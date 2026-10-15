package com.helpdesk360.dto;

import com.helpdesk360.model.Ticket;

import java.time.Instant;

public class TicketDTO {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private UserDTO reportedBy;
    private UserDTO assignedTo;
    private Instant createdAt;
    private Instant updatedAt;

    public TicketDTO() {}

    public static TicketDTO fromEntity(Ticket ticket) {
        TicketDTO dto = new TicketDTO();
        dto.setId(ticket.getId());
        dto.setTitle(ticket.getTitle());
        dto.setDescription(ticket.getDescription());
        dto.setCategory(ticket.getCategory().name());
        dto.setPriority(ticket.getPriority().name());
        dto.setStatus(ticket.getStatus().name());
        dto.setReportedBy(UserDTO.fromEntity(ticket.getReportedBy()));
        dto.setAssignedTo(UserDTO.fromEntity(ticket.getAssignedTo()));
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public UserDTO getReportedBy() { return reportedBy; }
    public void setReportedBy(UserDTO reportedBy) { this.reportedBy = reportedBy; }
    public UserDTO getAssignedTo() { return assignedTo; }
    public void setAssignedTo(UserDTO assignedTo) { this.assignedTo = assignedTo; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
