package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.example.demo.security.JwtFilter;

@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .cors(cors -> {
            })
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth

                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                .requestMatchers(
                        "/api/auth/register/**",
                        "/api/auth/login/**",
                        "/api/auth/forgot-password/**",
                        "/api/notifications/**"
                ).permitAll()

                .requestMatchers("/api/chat/**").authenticated()
                .requestMatchers("/api/patient/**").hasRole("PATIENT")
                .requestMatchers("/api/appointments/available").hasRole("PATIENT")

                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                .requestMatchers("/api/doctor/**").hasRole("DOCTOR")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
