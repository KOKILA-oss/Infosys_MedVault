package com.example.demo.dto;

import com.example.demo.entity.DoctorSettings;

public class DoctorSettingsResponse {

    private boolean appointmentNotifications;
    private boolean reportNotifications;
    private boolean scheduleReminders;
    private boolean availabilityVisible;
    private String themePreference;

    public DoctorSettingsResponse(DoctorSettings settings) {
        this.appointmentNotifications = settings.isAppointmentNotifications();
        this.reportNotifications = settings.isReportNotifications();
        this.scheduleReminders = settings.isScheduleReminders();
        this.availabilityVisible = settings.isAvailabilityVisible();
        this.themePreference = settings.getThemePreference();
    }

    public boolean isAppointmentNotifications() {
        return appointmentNotifications;
    }

    public boolean isReportNotifications() {
        return reportNotifications;
    }

    public boolean isScheduleReminders() {
        return scheduleReminders;
    }

    public boolean isAvailabilityVisible() {
        return availabilityVisible;
    }

    public String getThemePreference() {
        return themePreference;
    }
}
