package com.helpdesk360.dto;

public class UpdateTicketRequest {
    private String status;
    private Long assignedTo;

    public UpdateTicketRequest() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Long assignedTo) { this.assignedTo = assignedTo; }
}
