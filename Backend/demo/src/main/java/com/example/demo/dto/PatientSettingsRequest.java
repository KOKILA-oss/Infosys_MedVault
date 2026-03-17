package com.example.demo.dto;

public class PatientSettingsRequest {

    private boolean appointmentNotifications;
    private boolean reportNotifications;
    private boolean reminderNotifications;
    private boolean dataSharingEnabled;
    private boolean chatbotEnabled;
    private String themePreference;

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
