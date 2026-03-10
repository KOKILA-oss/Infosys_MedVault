package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.entity.MedicalRecordCategory;
import com.example.demo.entity.MedicalRecordConsent;

public class ConsentResponse {

    private Long id;
    private Long doctorId;
    private String doctorName;
    private MedicalRecordCategory category;
    private boolean active;
    private LocalDateTime grantedAt;
    private LocalDateTime expiresAt;

    public ConsentResponse() {
    }

    public ConsentResponse(MedicalRecordConsent consent) {
        this.id = consent.getId();
        this.doctorId = consent.getDoctor().getId();
        this.doctorName = consent.getDoctor().getName();
        this.category = consent.getCategory();
        this.active = consent.isActive();
        this.grantedAt = consent.getGrantedAt();
        this.expiresAt = consent.getExpiresAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public MedicalRecordCategory getCategory() {
        return category;
    }

    public void setCategory(MedicalRecordCategory category) {
        this.category = category;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getGrantedAt() {
        return grantedAt;
    }

    public void setGrantedAt(LocalDateTime grantedAt) {
        this.grantedAt = grantedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
