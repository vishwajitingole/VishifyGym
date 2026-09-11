package com.amazon.scorecard.utils;

import java.util.Date;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Component
class JwtUtil {

    private final String SECRET = "mysecretkey";

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(SignatureAlgorithm.HS256, SECRET)
                .compact();
    }

    public String extractEmail(String token) {
        // 1. Get the Builder
        // 2. Configure it (set the key)
        // 3. Build the immutable Parser
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token) // 4. Use the thread-safe parser
                .getPayload()
                .getSubject();
    }
}
