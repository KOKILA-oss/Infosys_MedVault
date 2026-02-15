package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.DoctorProfile;
import com.example.demo.entity.User;

public interface DoctorProfileRepository 
    extends JpaRepository<DoctorProfile, Long> {

    Optional<DoctorProfile> findByUser(User user);
}

