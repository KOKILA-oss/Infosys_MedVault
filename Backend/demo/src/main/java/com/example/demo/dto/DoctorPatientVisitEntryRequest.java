package com.example.demo.dto;

import java.time.LocalDate;
import java.util.List;

public class DoctorPatientVisitEntryRequest {
    private Long appointmentId;
    private String diagnosis;
    private String symptoms;
    private String vitals;
    private LocalDate followUpDate;
    private String doctorNotes;
    private List<RegistryPrescriptionItem> prescriptions;
    private List<RegistryCheckupItem> checkups;
    private List<RegistryTipItem> tips;

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
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
}
