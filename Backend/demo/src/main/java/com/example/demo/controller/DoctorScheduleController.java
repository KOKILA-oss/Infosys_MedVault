package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.DoctorScheduleConfigRequest;
import com.example.demo.service.DoctorScheduleService;

@RestController
@RequestMapping("/api/doctor/schedule")
public class DoctorScheduleController {

    private final DoctorScheduleService doctorScheduleService;

    public DoctorScheduleController(DoctorScheduleService doctorScheduleService) {
        this.doctorScheduleService = doctorScheduleService;
    }

    @GetMapping
    public ResponseEntity<DoctorScheduleConfigRequest> getMySchedule(Authentication authentication) {
        return ResponseEntity.ok(doctorScheduleService.getDoctorSchedule(authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<DoctorScheduleConfigRequest> updateMySchedule(
            @RequestBody DoctorScheduleConfigRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(doctorScheduleService.updateDoctorSchedule(authentication.getName(), request));
    }
}
