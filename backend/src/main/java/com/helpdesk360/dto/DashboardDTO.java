package com.helpdesk360.dto;

public class DashboardDTO {
    private long totalTickets;
    private long openTickets;
    private long inProgressTickets;
    private long resolvedTickets;
    private long closedTickets;
    private long urgentTickets;
    private long highPriorityTickets;
    private long assignedTickets;
    private long completedTickets;
    private long openUrgentTickets;

    public DashboardDTO() {}

    public long getTotalTickets() { return totalTickets; }
    public void setTotalTickets(long totalTickets) { this.totalTickets = totalTickets; }
    public long getOpenTickets() { return openTickets; }
    public void setOpenTickets(long openTickets) { this.openTickets = openTickets; }
    public long getInProgressTickets() { return inProgressTickets; }
    public void setInProgressTickets(long inProgressTickets) { this.inProgressTickets = inProgressTickets; }
    public long getResolvedTickets() { return resolvedTickets; }
    public void setResolvedTickets(long resolvedTickets) { this.resolvedTickets = resolvedTickets; }
    public long getClosedTickets() { return closedTickets; }
    public void setClosedTickets(long closedTickets) { this.closedTickets = closedTickets; }
    public long getUrgentTickets() { return urgentTickets; }
    public void setUrgentTickets(long urgentTickets) { this.urgentTickets = urgentTickets; }
    public long getHighPriorityTickets() { return highPriorityTickets; }
    public void setHighPriorityTickets(long highPriorityTickets) { this.highPriorityTickets = highPriorityTickets; }
    public long getAssignedTickets() { return assignedTickets; }
    public void setAssignedTickets(long assignedTickets) { this.assignedTickets = assignedTickets; }
    public long getCompletedTickets() { return completedTickets; }
    public void setCompletedTickets(long completedTickets) { this.completedTickets = completedTickets; }
    public long getOpenUrgentTickets() { return openUrgentTickets; }
    public void setOpenUrgentTickets(long openUrgentTickets) { this.openUrgentTickets = openUrgentTickets; }
}
