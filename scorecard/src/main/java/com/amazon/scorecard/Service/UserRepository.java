package com.amazon.scorecard.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.amazon.scorecard.model.User;

@Repository
public class UserRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public User findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ?";
        return jdbcTemplate.queryForObject(
                sql,
                new BeanPropertyRowMapper<>(User.class),
                email);
    }

    public List<User> findAll() {
        return jdbcTemplate.query("SELECT id,name,email FROM users",
                new BeanPropertyRowMapper<>(User.class));
    }

    public void save(User user) {
        String sql = "INSERT INTO users(name, email, password) VALUES(?,?,?)";
        jdbcTemplate.update(sql,
                user.getName(),
                user.getEmail(),
                user.getPassword());
    }

}
