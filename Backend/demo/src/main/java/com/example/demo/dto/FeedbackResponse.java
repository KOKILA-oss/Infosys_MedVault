package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.entity.Feedback;

public class FeedbackResponse {

    private Long appointmentId;
    private String doctorName;
    private String patientName;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;

    public FeedbackResponse(Feedback feedback) {
        this.appointmentId = feedback.getAppointment() == null ? null : feedback.getAppointment().getId();
        this.doctorName = feedback.getDoctor() == null ? null : feedback.getDoctor().getName();
        this.patientName = feedback.getPatient().getName();
        this.rating = feedback.getRating();
        this.comment = feedback.getComment();
        this.createdAt = feedback.getCreatedAt();
    }

    public Long getAppointmentId() { return appointmentId; }
    public String getDoctorName() { return doctorName; }
    public String getPatientName() { return patientName; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
