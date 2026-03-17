package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.FeedbackRequest;
import com.example.demo.service.FeedbackService;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<?> submitFeedback(
            @RequestBody FeedbackRequest request,
            Authentication authentication) {

        feedbackService.submitFeedback(request, authentication.getName());
        return ResponseEntity.ok("Feedback submitted successfully");
    }

    @GetMapping("/doctor")
    public ResponseEntity<?> getDoctorFeedbacks(Authentication authentication) {

        return ResponseEntity.ok(
                feedbackService.getDoctorFeedbacks(authentication.getName())
        );
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyFeedbacks(Authentication authentication) {
        return ResponseEntity.ok(
                feedbackService.getPatientFeedbacks(authentication.getName())
        );
    }
}
