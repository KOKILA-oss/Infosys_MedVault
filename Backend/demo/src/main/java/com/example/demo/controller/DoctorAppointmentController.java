package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.RescheduleRequest;
import com.example.demo.dto.UpdateStatusRequest;
import com.example.demo.service.AppointmentService;

    @RestController
@RequestMapping("/api/doctor/appointments")
public class DoctorAppointmentController {

    private final AppointmentService appointmentService;

    public DoctorAppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    // Get all doctor appointments
    @GetMapping
    public ResponseEntity<?> getDoctorAppointments(Authentication authentication) {

        String doctorEmail = authentication.getName();

        return ResponseEntity.ok(
                appointmentService.getDoctorAppointments(doctorEmail)
        );
    }

    // Today's appointments
    @GetMapping("/today")
    public ResponseEntity<?> getTodayAppointments(Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                appointmentService.getTodayAppointmentsForDoctor(email)
        );
    }

    @GetMapping("/patients")
    public ResponseEntity<?> getDoctorPatients(Authentication authentication) {

        String doctorEmail = authentication.getName();

        return ResponseEntity.ok(
                appointmentService.getDoctorPatientRegistry(doctorEmail)
        );
    }

    // Update status
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request,
            Authentication authentication) {

        String doctorEmail = authentication.getName();

        appointmentService.updateAppointmentStatus(
                id,
                request.getStatus(),
                doctorEmail
        );

        return ResponseEntity.ok("Appointment status updated");
    }

    @PostMapping("/reschedule")
public ResponseEntity<?> rescheduleAppointment(
        @RequestBody RescheduleRequest request,
        Authentication authentication) {

    String doctorEmail = authentication.getName();

    appointmentService.rescheduleAppointment(request, doctorEmail);

    return ResponseEntity.ok("Appointment rescheduled successfully");
}
}

