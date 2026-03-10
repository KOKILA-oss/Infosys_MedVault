package com.example.demo.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.ReminderRequest;
import com.example.demo.dto.ReminderResponse;
import com.example.demo.service.ReminderService;

@RestController
@RequestMapping("/api/patient/reminders")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @PostMapping
    public ResponseEntity<ReminderResponse> createReminder(Principal principal,
                                                           @RequestBody ReminderRequest request) {
        return ResponseEntity.ok(
                new ReminderResponse(reminderService.createReminder(principal.getName(), request))
        );
    }

    @GetMapping
    public ResponseEntity<List<ReminderResponse>> myReminders(Principal principal) {
        return ResponseEntity.ok(
                reminderService.getMyReminders(principal.getName())
                        .stream()
                        .map(ReminderResponse::new)
                        .toList()
        );
    }
}
