package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Optional;
import com.example.demo.entity.EmailOtp;

import jakarta.transaction.Transactional;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {
    Optional<EmailOtp> findByEmail(String email);
    @Modifying
@Transactional
void deleteByEmail(String email);
}
