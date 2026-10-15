package com.helpdesk360.dto;

import com.helpdesk360.model.StatusHistory;

import java.time.Instant;

public class StatusHistoryDTO {
    private Long id;
    private Long ticketId;
    private UserDTO changedBy;
    private String oldStatus;
    private String newStatus;
    private Instant changedAt;

    public StatusHistoryDTO() {}

    public static StatusHistoryDTO fromEntity(StatusHistory sh) {
        StatusHistoryDTO dto = new StatusHistoryDTO();
        dto.setId(sh.getId());
        dto.setTicketId(sh.getTicket().getId());
        dto.setChangedBy(UserDTO.fromEntity(sh.getChangedBy()));
        dto.setOldStatus(sh.getOldStatus() != null ? sh.getOldStatus().name() : null);
        dto.setNewStatus(sh.getNewStatus().name());
        dto.setChangedAt(sh.getChangedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
    public UserDTO getChangedBy() { return changedBy; }
    public void setChangedBy(UserDTO changedBy) { this.changedBy = changedBy; }
    public String getOldStatus() { return oldStatus; }
    public void setOldStatus(String oldStatus) { this.oldStatus = oldStatus; }
    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public Instant getChangedAt() { return changedAt; }
    public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }
}
