package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.DoctorProfile;
import com.example.demo.service.DoctorProfileService;

@RestController
@RequestMapping("/api/doctor/profile")
public class DoctorProfileController {

    private final DoctorProfileService doctorProfileService;

    public DoctorProfileController(DoctorProfileService doctorProfileService) {
        this.doctorProfileService = doctorProfileService;
    }

    // 🔹 GET /api/doctor/profile
    @GetMapping
    public ResponseEntity<?> getMyProfile(Authentication authentication) {

        String email = authentication.getName();

        DoctorProfile profile = doctorProfileService.getMyProfile(email);

        return ResponseEntity.ok(profile);
    }

    // 🔹 PUT /api/doctor/profile
    @PutMapping
    public ResponseEntity<?> updateMyProfile(
            @RequestBody DoctorProfile updatedData,
            Authentication authentication) {

        String email = authentication.getName();

        DoctorProfile updated =
                doctorProfileService.updateMyProfile(email, updatedData);

        return ResponseEntity.ok(updated);
    }
}

