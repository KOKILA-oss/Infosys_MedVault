package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class PatientSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    private boolean appointmentNotifications = true;
    private boolean reportNotifications = true;
    private boolean reminderNotifications = true;
    private boolean dataSharingEnabled = false;
    private boolean chatbotEnabled = true;
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

    public boolean isReminderNotifications() {
        return reminderNotifications;
    }

    public void setReminderNotifications(boolean reminderNotifications) {
        this.reminderNotifications = reminderNotifications;
    }

    public boolean isDataSharingEnabled() {
        return dataSharingEnabled;
    }

    public void setDataSharingEnabled(boolean dataSharingEnabled) {
        this.dataSharingEnabled = dataSharingEnabled;
    }

    public boolean isChatbotEnabled() {
        return chatbotEnabled;
    }

    public void setChatbotEnabled(boolean chatbotEnabled) {
        this.chatbotEnabled = chatbotEnabled;
    }

    public String getThemePreference() {
        return themePreference;
    }

    public void setThemePreference(String themePreference) {
        this.themePreference = themePreference;
    }
}
