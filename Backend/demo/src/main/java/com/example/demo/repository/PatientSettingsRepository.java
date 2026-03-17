package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.PatientSettings;
import com.example.demo.entity.User;

public interface PatientSettingsRepository extends JpaRepository<PatientSettings, Long> {

    Optional<PatientSettings> findByUser(User user);
}
