package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.demo.entity.PatientProfile;
import com.example.demo.service.PatientProfileService;

@RestController
@RequestMapping("/api/patient/profile")
public class PatientProfileController {

    private final PatientProfileService patientProfileService;

    public PatientProfileController(PatientProfileService patientProfileService) {
        this.patientProfileService = patientProfileService;
    }

    // 🔹 GET /api/patient/profile
    @GetMapping
    public ResponseEntity<?> getMyProfile(Authentication authentication) {

        String email = authentication.getName();

        PatientProfile profile = patientProfileService.getMyProfile(email);

        return ResponseEntity.ok(profile);
    }

    // 🔹 PUT /api/patient/profile
    @PutMapping
    public ResponseEntity<?> updateMyProfile(
            @RequestBody PatientProfile updatedData,
            Authentication authentication) {

        String email = authentication.getName();

        PatientProfile updated =
                patientProfileService.updateMyProfile(email, updatedData);

        return ResponseEntity.ok(updated);
    }
}
