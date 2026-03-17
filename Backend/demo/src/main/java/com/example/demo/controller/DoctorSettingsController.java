package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.DoctorSettingsRequest;
import com.example.demo.dto.DoctorSettingsResponse;
import com.example.demo.entity.DoctorSettings;
import com.example.demo.service.DoctorSettingsService;

@RestController
@RequestMapping("/api/doctor/settings")
public class DoctorSettingsController {

    private final DoctorSettingsService doctorSettingsService;

    public DoctorSettingsController(DoctorSettingsService doctorSettingsService) {
        this.doctorSettingsService = doctorSettingsService;
    }

    @GetMapping
    public ResponseEntity<DoctorSettingsResponse> getMySettings(Authentication authentication) {
        DoctorSettings settings = doctorSettingsService.getMySettings(authentication.getName());
        return ResponseEntity.ok(new DoctorSettingsResponse(settings));
    }

    @PutMapping
    public ResponseEntity<DoctorSettingsResponse> updateMySettings(
            @RequestBody DoctorSettingsRequest request,
            Authentication authentication) {
        DoctorSettings settings = doctorSettingsService.updateMySettings(authentication.getName(), request);
        return ResponseEntity.ok(new DoctorSettingsResponse(settings));
    }
}
