package com.helpdesk360.repository;

import com.helpdesk360.model.StatusHistory;
import com.helpdesk360.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {
    List<StatusHistory> findByTicketOrderByChangedAtDesc(Ticket ticket);
    List<StatusHistory> findByTicketIdOrderByChangedAtAsc(Long ticketId);
}
