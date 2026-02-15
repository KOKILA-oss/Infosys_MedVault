package com.example.demo.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.example.demo.entity.Appointment;

public class AppointmentResponse {

    private Long id;
    private String patientName;
    private String doctorName;
    private LocalDate date;
    private LocalTime time;
    private String reason;
    private String status;

    public AppointmentResponse(Appointment appointment) {
        this.id = appointment.getId();
        this.patientName = appointment.getPatient().getName();
        this.doctorName = appointment.getDoctor().getName();
        this.date = appointment.getAppointmentDate();
        this.time = appointment.getAppointmentTime();
        this.reason = appointment.getReason();
        this.status = appointment.getStatus().name();
    }

    public Long getId() {
        return id;
    }

    public String getPatientName() {
        return patientName;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public LocalDate getDate() {
        return date;
    }

    public LocalTime getTime() {
        return time;
    }

    public String getReason() {
        return reason;
    }

    public String getStatus() {
        return status;
    }

    // getters
}

