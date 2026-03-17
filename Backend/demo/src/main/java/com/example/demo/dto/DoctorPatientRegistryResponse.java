package com.example.demo.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DoctorPatientRegistryResponse {

    private Long patientId;
    private String name;
    private String email;
    private String phoneNumber;
    private String gender;
    private String bloodGroup;
    private Double height;
    private Double weight;
    private Double sugarLevel;
    private String address;
    private String allergies;
    private String emergencyContact;
    private long appointmentCount;
    private LocalDate latestAppointmentDate;
    private String latestAppointmentStatus;
    private List<AppointmentResponse> appointments = new ArrayList<>();
    private List<DoctorPatientVisitEntryResponse> visitEntries = new ArrayList<>();

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getSugarLevel() {
        return sugarLevel;
    }

    public void setSugarLevel(Double sugarLevel) {
        this.sugarLevel = sugarLevel;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public long getAppointmentCount() {
        return appointmentCount;
    }

    public void setAppointmentCount(long appointmentCount) {
        this.appointmentCount = appointmentCount;
    }

    public LocalDate getLatestAppointmentDate() {
        return latestAppointmentDate;
    }

    public void setLatestAppointmentDate(LocalDate latestAppointmentDate) {
        this.latestAppointmentDate = latestAppointmentDate;
    }

    public String getLatestAppointmentStatus() {
        return latestAppointmentStatus;
    }

    public void setLatestAppointmentStatus(String latestAppointmentStatus) {
        this.latestAppointmentStatus = latestAppointmentStatus;
    }

    public List<AppointmentResponse> getAppointments() {
        return appointments;
    }

    public void setAppointments(List<AppointmentResponse> appointments) {
        this.appointments = appointments;
    }

    public List<DoctorPatientVisitEntryResponse> getVisitEntries() {
        return visitEntries;
    }

    public void setVisitEntries(List<DoctorPatientVisitEntryResponse> visitEntries) {
        this.visitEntries = visitEntries;
    }
}
