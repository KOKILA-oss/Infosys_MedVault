package com.example.demo.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;


    @Entity
public class DoctorProfile {

    public Long getId() {
            return id;
        }
        public void setId(Long id) {
            this.id = id;
        }
        public User getUser() {
            return user;
        }
        public void setUser(User user) {
            this.user = user;
        }
        public String getPhoneNumber() {
            return phoneNumber;
        }
        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }
        public String getSpecialization() {
            return specialization;
        }
        public void setSpecialization(String specialization) {
            this.specialization = specialization;
        }
        public Integer getExperienceYears() {
            return experienceYears;
        }
        public void setExperienceYears(Integer experienceYears) {
            this.experienceYears = experienceYears;
        }
        public String getQualification() {
            return qualification;
        }
        public void setQualification(String qualification) {
            this.qualification = qualification;
        }
        public String getLicenseNumber() {
            return licenseNumber;
        }
        public void setLicenseNumber(String licenseNumber) {
            this.licenseNumber = licenseNumber;
        }
        public String getHospitalName() {
            return hospitalName;
        }
        public void setHospitalName(String hospitalName) {
            this.hospitalName = hospitalName;
        }
        public String getHospitalAddress() {
            return hospitalAddress;
        }
        public void setHospitalAddress(String hospitalAddress) {
            this.hospitalAddress = hospitalAddress;
        }
        public String getConsultationMode() {
            return consultationMode;
        }
        public void setConsultationMode(String consultationMode) {
            this.consultationMode = consultationMode;
        }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String phoneNumber;
    private String specialization;
    private Integer experienceYears;
    private String qualification;
    private String licenseNumber;
    private String hospitalName;
    private String hospitalAddress;
    private String consultationMode;
}


