package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.MedicalRecordConsent;
import com.example.demo.entity.User;

public interface MedicalRecordConsentRepository extends JpaRepository<MedicalRecordConsent, Long> {

    List<MedicalRecordConsent> findByPatientAndDoctorAndActiveTrue(User patient, User doctor);

    List<MedicalRecordConsent> findByPatientAndActiveTrue(User patient);
}
