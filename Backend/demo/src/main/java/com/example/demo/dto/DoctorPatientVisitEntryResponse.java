package com.example.demo.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class DoctorPatientVisitEntryResponse {
    private Long id;
    private Long appointmentId;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String doctorName;
    private String diagnosis;
    private String symptoms;
    private String vitals;
    private LocalDate followUpDate;
    private String doctorNotes;
    private List<RegistryPrescriptionItem> prescriptions = new ArrayList<>();
    private List<RegistryCheckupItem> checkups = new ArrayList<>();
    private List<RegistryTipItem> tips = new ArrayList<>();
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(LocalTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getVitals() {
        return vitals;
    }

    public void setVitals(String vitals) {
        this.vitals = vitals;
    }

    public LocalDate getFollowUpDate() {
        return followUpDate;
    }

    public void setFollowUpDate(LocalDate followUpDate) {
        this.followUpDate = followUpDate;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }

    public List<RegistryPrescriptionItem> getPrescriptions() {
        return prescriptions;
    }

    public void setPrescriptions(List<RegistryPrescriptionItem> prescriptions) {
        this.prescriptions = prescriptions;
    }

    public List<RegistryCheckupItem> getCheckups() {
        return checkups;
    }

    public void setCheckups(List<RegistryCheckupItem> checkups) {
        this.checkups = checkups;
    }

    public List<RegistryTipItem> getTips() {
        return tips;
    }

    public void setTips(List<RegistryTipItem> tips) {
        this.tips = tips;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
