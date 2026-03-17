package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class DoctorScheduleConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "doctor_id", unique = true, nullable = false)
    private User doctor;

    @Column(nullable = false, length = 4000)
    private String defaultSlotsJson;

    @Column(nullable = false, length = 128)
    private String defaultActiveDaysCsv;

    @Column(nullable = false, length = 12000)
    private String dayConfigsJson;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getDoctor() {
        return doctor;
    }

    public void setDoctor(User doctor) {
        this.doctor = doctor;
    }

    public String getDefaultSlotsJson() {
        return defaultSlotsJson;
    }

    public void setDefaultSlotsJson(String defaultSlotsJson) {
        this.defaultSlotsJson = defaultSlotsJson;
    }

    public String getDefaultActiveDaysCsv() {
        return defaultActiveDaysCsv;
    }

    public void setDefaultActiveDaysCsv(String defaultActiveDaysCsv) {
        this.defaultActiveDaysCsv = defaultActiveDaysCsv;
    }

    public String getDayConfigsJson() {
        return dayConfigsJson;
    }

    public void setDayConfigsJson(String dayConfigsJson) {
        this.dayConfigsJson = dayConfigsJson;
    }
}
