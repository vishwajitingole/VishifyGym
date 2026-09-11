package com.amazon.scorecard.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.amazon.scorecard.DAO.TicketDAO;
import com.amazon.scorecard.model.Ticket;

@Service
public class TicketService {

    @Autowired
    private TicketDAO dao;

    public void createTicket(Ticket t) throws Exception {
        dao.createTicket(t);
    }

    public void patchTicket(Ticket t) throws Exception {
        dao.patchTicket(t);
    }

    public List<Ticket> getAllTicker() {
        return dao.getAllTickets();
    }

    public Ticket getTicketbyId(int id) {
        return dao.getTicketbyID(id);
    }
}
