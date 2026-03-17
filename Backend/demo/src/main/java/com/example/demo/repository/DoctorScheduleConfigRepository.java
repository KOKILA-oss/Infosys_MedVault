package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.DoctorScheduleConfig;
import com.example.demo.entity.User;

public interface DoctorScheduleConfigRepository extends JpaRepository<DoctorScheduleConfig, Long> {

    Optional<DoctorScheduleConfig> findByDoctor(User doctor);
}
