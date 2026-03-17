package com.example.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.PatientTipResponse;
import com.example.demo.service.AppointmentService;

@RestController
@RequestMapping("/api/patient/tips")
public class PatientTipsController {

    private final AppointmentService appointmentService;

    public PatientTipsController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public ResponseEntity<List<PatientTipResponse>> getTips(Authentication authentication) {
        return ResponseEntity.ok(appointmentService.getPersonalizedTips(authentication.getName()));
    }
}
