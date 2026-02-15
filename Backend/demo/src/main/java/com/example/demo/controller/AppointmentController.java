package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.AppointmentRequest;
import com.example.demo.dto.UpdateStatusRequest;
import com.example.demo.service.AppointmentService;
import org.springframework.security.core.Authentication;

    
    @RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<?> bookAppointment(@RequestBody AppointmentRequest request,
                                             Authentication authentication) {

        // Extract email from JWT
        String patientEmail = authentication.getName();

        appointmentService.bookAppointment(request, patientEmail);

        return ResponseEntity.ok("Appointment booked successfully (Pending approval)");
    }

    @GetMapping("/doctor")
public ResponseEntity<?> getDoctorAppointments(Authentication authentication) {

    String doctorEmail = authentication.getName();

    return ResponseEntity.ok(
            appointmentService.getDoctorAppointments(doctorEmail)
    );
}

@PutMapping("/{id}/status")
public ResponseEntity<?> updateStatus(@PathVariable Long id,
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

}

