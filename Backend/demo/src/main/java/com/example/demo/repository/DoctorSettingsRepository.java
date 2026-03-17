package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.DoctorSettings;
import com.example.demo.entity.User;

public interface DoctorSettingsRepository extends JpaRepository<DoctorSettings, Long> {

    Optional<DoctorSettings> findByUser(User user);
}
