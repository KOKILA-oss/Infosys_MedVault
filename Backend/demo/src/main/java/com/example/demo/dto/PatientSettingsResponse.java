package com.example.demo.dto;

import com.example.demo.entity.PatientSettings;

public class PatientSettingsResponse {

    private boolean appointmentNotifications;
    private boolean reportNotifications;
    private boolean reminderNotifications;
    private boolean dataSharingEnabled;
    private boolean chatbotEnabled;
    private String themePreference;

    public PatientSettingsResponse(PatientSettings settings) {
        this.appointmentNotifications = settings.isAppointmentNotifications();
        this.reportNotifications = settings.isReportNotifications();
        this.reminderNotifications = settings.isReminderNotifications();
        this.dataSharingEnabled = settings.isDataSharingEnabled();
        this.chatbotEnabled = settings.isChatbotEnabled();
        this.themePreference = settings.getThemePreference();
    }

    public boolean isAppointmentNotifications() {
        return appointmentNotifications;
    }

    public boolean isReportNotifications() {
        return reportNotifications;
    }

    public boolean isReminderNotifications() {
        return reminderNotifications;
    }

    public boolean isDataSharingEnabled() {
        return dataSharingEnabled;
    }

    public boolean isChatbotEnabled() {
        return chatbotEnabled;
    }

    public String getThemePreference() {
        return themePreference;
    }
}
