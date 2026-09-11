package com.amazon.scorecard.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.amazon.scorecard.Service.UserRepository;
import com.amazon.scorecard.model.User;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserRepository repo;

    @GetMapping
    public List<User> getAllUsers(HttpServletRequest request) {

        String email = (String) request.getAttribute("email");

        if (email == null) {
            throw new RuntimeException("Unauthorized");
        }

        return repo.findAll();
    }
}
