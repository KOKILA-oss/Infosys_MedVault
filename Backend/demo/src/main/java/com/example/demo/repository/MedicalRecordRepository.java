package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.MedicalRecord;
import com.example.demo.entity.MedicalRecordCategory;
import com.example.demo.entity.User;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByOwnerAndDeletedFalseOrderByCreatedAtDesc(User owner);

    List<MedicalRecord> findByOwnerAndCategoryAndDeletedFalseOrderByCreatedAtDesc(
            User owner,
            MedicalRecordCategory category
    );

    List<MedicalRecord> findByOwnerAndSharedDoctorAndDeletedFalseOrderByCreatedAtDesc(
            User owner,
            User sharedDoctor
    );

    List<MedicalRecord> findByOwnerAndSharedDoctorAndCategoryAndDeletedFalseOrderByCreatedAtDesc(
            User owner,
            User sharedDoctor,
            MedicalRecordCategory category
    );

    Optional<MedicalRecord> findByIdAndDeletedFalse(Long id);
}
