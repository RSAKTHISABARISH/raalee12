package com.helpdesk360.repository;

import com.helpdesk360.model.Ticket;
import com.helpdesk360.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByReportedByOrderByCreatedAtDesc(User reportedBy);

    List<Ticket> findByAssignedToOrderByCreatedAtDesc(User assignedTo);

    @Query("SELECT t FROM Ticket t ORDER BY " +
           "CASE t.priority WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 END, " +
           "t.createdAt DESC")
    List<Ticket> findAllOrderByPriorityAndDate();

    long countByStatus(Ticket.Status status);

    long countByPriority(Ticket.Priority priority);

    long countByStatusAndPriority(Ticket.Status status, Ticket.Priority priority);

    long countByAssignedToIsNotNull();

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status IN ('RESOLVED', 'CLOSED')")
    long countCompleted();

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = 'OPEN' AND t.priority = 'URGENT'")
    long countOpenUrgent();

    List<Ticket> findByStatusOrderByCreatedAtDesc(Ticket.Status status);

    List<Ticket> findByPriorityOrderByCreatedAtDesc(Ticket.Priority priority);

    List<Ticket> findByCategoryOrderByCreatedAtDesc(Ticket.Category category);
}
