package com.example.demo.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.entity.PatientProfile;
import com.example.demo.entity.User;

public interface PatientProfileRepository 
    extends JpaRepository<PatientProfile, Long> {

    Optional<PatientProfile> findByUser(User user);
}

