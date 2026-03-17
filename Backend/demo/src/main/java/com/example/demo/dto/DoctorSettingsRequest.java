package com.example.demo.dto;

public class DoctorSettingsRequest {

    private boolean appointmentNotifications;
    private boolean reportNotifications;
    private boolean scheduleReminders;
    private boolean availabilityVisible;
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
