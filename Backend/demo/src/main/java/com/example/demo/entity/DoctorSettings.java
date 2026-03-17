package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class DoctorSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    private boolean appointmentNotifications = true;
    private boolean reportNotifications = true;
    private boolean scheduleReminders = true;
    private boolean availabilityVisible = true;
    private String themePreference = "light";

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

    public boolean isAppointmentNotifications() {
        return appointmentNotifications;
    }

    public void setAppointmentNotifications(boolean appointmentNotifications) {
        this.appointmentNotifications = appointmentNotifications;
    }

    public boolean isReportNotifications() {
        return reportNotifications;
    }

    public void setReportNotifications(boolean reportNotifications) {
        this.reportNotifications = reportNotifications;
    }

    public boolean isScheduleReminders() {
        return scheduleReminders;
    }

    public void setScheduleReminders(boolean scheduleReminders) {
        this.scheduleReminders = scheduleReminders;
    }

    public boolean isAvailabilityVisible() {
        return availabilityVisible;
    }

    public void setAvailabilityVisible(boolean availabilityVisible) {
        this.availabilityVisible = availabilityVisible;
    }

    public String getThemePreference() {
        return themePreference;
    }

    public void setThemePreference(String themePreference) {
        this.themePreference = themePreference;
    }
}
