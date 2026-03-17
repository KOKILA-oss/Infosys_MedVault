package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.DoctorPatientVisitEntry;
import com.example.demo.entity.User;

public interface DoctorPatientVisitEntryRepository extends JpaRepository<DoctorPatientVisitEntry, Long> {

    List<DoctorPatientVisitEntry> findByDoctorAndPatientOrderByCreatedAtDesc(User doctor, User patient);

    List<DoctorPatientVisitEntry> findByPatientOrderByCreatedAtDesc(User patient);
}
