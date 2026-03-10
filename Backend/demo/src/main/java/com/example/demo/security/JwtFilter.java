package com.example.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Locale;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            String token = authHeader.substring(7);

            if (jwtUtil.isTokenValid(token)) {

    String email = jwtUtil.extractEmail(token);
    String roleFromToken = jwtUtil.extractRole(token);

    String authority;
    User dbUser = userRepository.findByEmail(email).orElse(null);
    if (dbUser != null && dbUser.getRole() != null) {
        authority = "ROLE_" + dbUser.getRole().name();
    } else {
        String safeRole = roleFromToken == null ? "" : roleFromToken.trim();
        if (safeRole.isEmpty()) {
            authority = "ROLE_UNKNOWN";
        } else if (safeRole.startsWith("ROLE_")) {
            authority = safeRole.toUpperCase(Locale.ROOT);
        } else {
            authority = ("ROLE_" + safeRole).toUpperCase(Locale.ROOT);
        }
    }

    UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                    email,
                    null,
                    Collections.singletonList(
                        new SimpleGrantedAuthority(authority)
                    )
            );

    authentication.setDetails(
            new WebAuthenticationDetailsSource().buildDetails(request)
    );

    SecurityContextHolder.getContext().setAuthentication(authentication);
}

        }

        filterChain.doFilter(request, response);
    }
}
