package com.example.demo.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.DoctorSummary;
import com.example.demo.entity.DoctorProfile;
import com.example.demo.entity.Feedback;
import com.example.demo.repository.DoctorProfileRepository;
import com.example.demo.repository.FeedbackRepository;

@RestController
@RequestMapping("/api")
public class DoctorsController {

    private final DoctorProfileRepository doctorProfileRepository;
    private final FeedbackRepository feedbackRepository;

    public DoctorsController(DoctorProfileRepository doctorProfileRepository,
                             FeedbackRepository feedbackRepository) {
        this.doctorProfileRepository = doctorProfileRepository;
        this.feedbackRepository = feedbackRepository;
    }

    @GetMapping("/doctors")
    public ResponseEntity<?> listDoctors() {
        List<DoctorSummary> out = doctorProfileRepository.findAll()
                .stream()
                .map(this::map)
                .collect(Collectors.toList());

        return ResponseEntity.ok(out);
    }

    private DoctorSummary map(DoctorProfile p) {
        Long id = p.getUser() != null ? p.getUser().getId() : null;
        String name = p.getUser() != null ? p.getUser().getName() : null;
        String email = p.getUser() != null ? p.getUser().getEmail() : null;
        String spec = p.getSpecialization();
        String hosp = p.getHospital() != null ? p.getHospital().getName() : null;
        java.util.List<Feedback> feedbacks = p.getUser() == null
                ? java.util.List.of()
                : feedbackRepository.findByDoctor(p.getUser());
        long reviewCount = feedbacks.size();
        double averageRating = reviewCount == 0
                ? 0.0
                : feedbacks.stream().mapToInt(Feedback::getRating).average().orElse(0.0);
        return new DoctorSummary(id, name, email, spec, hosp, averageRating, reviewCount);
    }
}
