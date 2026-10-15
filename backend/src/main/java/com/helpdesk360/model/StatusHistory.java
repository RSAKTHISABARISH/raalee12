package com.helpdesk360.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "status_history")
public class StatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "changed_by", nullable = false)
    private User changedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status")
    private Ticket.Status oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false)
    private Ticket.Status newStatus;

    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;

    @PrePersist
    protected void onCreate() {
        this.changedAt = Instant.now();
    }

    // Constructors
    public StatusHistory() {}

    public StatusHistory(Ticket ticket, User changedBy, Ticket.Status oldStatus, Ticket.Status newStatus) {
        this.ticket = ticket;
        this.changedBy = changedBy;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Ticket getTicket() { return ticket; }
    public void setTicket(Ticket ticket) { this.ticket = ticket; }
    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }
    public Ticket.Status getOldStatus() { return oldStatus; }
    public void setOldStatus(Ticket.Status oldStatus) { this.oldStatus = oldStatus; }
    public Ticket.Status getNewStatus() { return newStatus; }
    public void setNewStatus(Ticket.Status newStatus) { this.newStatus = newStatus; }
    public Instant getChangedAt() { return changedAt; }
    public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }
}
