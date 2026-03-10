package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.entity.MedicalRecordCategory;

public class ConsentRequest {

    private Long doctorId;
    private MedicalRecordCategory category;
    private LocalDateTime expiresAt;

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public MedicalRecordCategory getCategory() {
        return category;
    }

    public void setCategory(MedicalRecordCategory category) {
        this.category = category;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
