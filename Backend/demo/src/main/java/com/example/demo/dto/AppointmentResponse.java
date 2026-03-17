package com.example.demo.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.example.demo.entity.Appointment;

public class AppointmentResponse {

    private Long id;
    private Long doctorId;
    private Long patientId;
    private String doctorName;
    private String patientName;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String status;
    private String reason;

    public AppointmentResponse(Appointment appointment) {
        this.id = appointment.getId();
        this.doctorId = appointment.getDoctor().getId();
        this.patientId = appointment.getPatient().getId();
        this.doctorName = appointment.getDoctor().getName();
        this.patientName = appointment.getPatient().getName();
        this.appointmentDate = appointment.getAppointmentDate();
        this.appointmentTime = appointment.getAppointmentTime();
        this.status = appointment.getStatus().name();
        this.reason = appointment.getReason();
    }

    public Long getId() { return id; }
    public Long getDoctorId() { return doctorId; }
    public Long getPatientId() { return patientId; }
    public String getDoctorName() { return doctorName; }
    public String getPatientName() { return patientName; }
    public LocalDate getAppointmentDate() { return appointmentDate; }
    public LocalTime getAppointmentTime() { return appointmentTime; }
    public String getStatus() { return status; }
    public String getReason() { return reason; }
}
