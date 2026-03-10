package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.MedicalRecordAuditLog;

public interface MedicalRecordAuditLogRepository extends JpaRepository<MedicalRecordAuditLog, Long> {

    List<MedicalRecordAuditLog> findByMedicalRecordIdOrderByCreatedAtDesc(Long medicalRecordId);
}
