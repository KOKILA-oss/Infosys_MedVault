package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.PatientSettingsRequest;
import com.example.demo.dto.PatientSettingsResponse;
import com.example.demo.entity.PatientSettings;
import com.example.demo.service.PatientSettingsService;

@RestController
@RequestMapping("/api/patient/settings")
public class PatientSettingsController {

    private final PatientSettingsService patientSettingsService;

    public PatientSettingsController(PatientSettingsService patientSettingsService) {
        this.patientSettingsService = patientSettingsService;
    }

    @GetMapping
    public ResponseEntity<PatientSettingsResponse> getMySettings(Authentication authentication) {
        PatientSettings settings = patientSettingsService.getMySettings(authentication.getName());
        return ResponseEntity.ok(new PatientSettingsResponse(settings));
    }

    @PutMapping
    public ResponseEntity<PatientSettingsResponse> updateMySettings(
            @RequestBody PatientSettingsRequest request,
            Authentication authentication) {
        PatientSettings settings = patientSettingsService.updateMySettings(authentication.getName(), request);
        return ResponseEntity.ok(new PatientSettingsResponse(settings));
    }
}
