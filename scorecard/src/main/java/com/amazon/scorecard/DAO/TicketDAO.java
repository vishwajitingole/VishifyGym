package com.amazon.scorecard.DAO;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.amazon.scorecard.exception.ResourceNotFoundException;
import com.amazon.scorecard.model.Ticket;

@Repository
public class TicketDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void createTicket(Ticket t) {
        String sql = "INSERT INTO tickets(id,title, description, status, priority) VALUES (? ,? , ?, ?, ?)";
        jdbcTemplate.update(sql, t.getId(), t.getTitle(), t.getDescription(), t.getStatus(), t.getPriority());
    }

    public void patchTicket(Ticket t) {
        String sql = "UPDATE tickets SET title=?, description=?,status=?,priority=? where id=?";
        jdbcTemplate.update(sql, t.getTitle(), t.getDescription(), t.getStatus(), t.getPriority(), t.getId());
    }

    public List<Ticket> getAllTickets() {
        String sql = "SELECT * FROM tickets";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Ticket t = new Ticket();
            t.setId(rs.getInt("id"));
            t.setTitle(rs.getString("title"));
            t.setDescription(rs.getString("description"));
            t.setStatus(rs.getString("status"));
            t.setPriority(rs.getString("priority"));
            return t;
        });
    }

    public Ticket getTicketbyID(int id) {
        String sql = "SELECT * FROM tickets where id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
                Ticket t = new Ticket();
                t.setId(rs.getInt("id"));
                t.setTitle(rs.getString("title"));
                t.setDescription(rs.getString("description"));
                t.setStatus(rs.getString("status"));
                t.setPriority(rs.getString("priority"));
                return t;
            }, id);
        } catch (EmptyResultDataAccessException e) {
            // Jab record nahi milta, JDBC Template ye exception throw karta hai
            // Hum ise pakad kar apni custom exception throw karenge
            throw new ResourceNotFoundException("Ticket not found with id: " + id);
        }
    }
}