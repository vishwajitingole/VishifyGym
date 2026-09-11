package com.amazon.scorecard.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.amazon.scorecard.Service.TicketService;
import com.amazon.scorecard.model.Ticket;

@RestController
@RequestMapping("/api/tickets")
class TicketController {

    @Autowired
    private TicketService service;

    @GetMapping
    public List<Ticket> getAllTicker() {
        return service.getAllTicker();
    }

    // @GetMapping("/secure-data")
    // public String getSecureData(@RequestHeader("auth-token") String token) {
    // return "Token received: " + token;
    // }

    // @GetMapping("/check-session")
    // public String readCookie(@CookieValue(value = "sessionID", defaultValue =
    // "none") String sessionId) {
    // return "Session ID is: " + sessionId;
    // }

    // localhost:8080/tickets?id=101
    @GetMapping("/find")
    public Ticket getTicketByID(@RequestParam("id") int id) {
        return service.getTicketbyId(id);
    }

    // localhost:8080/tickets/101

    @GetMapping("/{id}")
    public Ticket getTicket(@PathVariable("id") int id) {

        return service.getTicketbyId(id);
    }

    @PostMapping
    public String create(@RequestBody Ticket t) throws Exception {
        service.createTicket(t);
        return "Ticket created";
    }

    @PatchMapping
    public String patch(@RequestBody Ticket t) throws Exception {
        service.patchTicket(t);
        return "Ticket changed";
    }

    // @PostMapping("/create")
    // public String createT(@ModelAttribute Ticket t) throws Exception {
    // service.createTicket(t);
    // return "Ticket created";
    // }
}
