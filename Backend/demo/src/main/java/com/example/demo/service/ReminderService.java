package com.example.demo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.ReminderRequest;
import com.example.demo.entity.Reminder;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.ReminderRepository;
import com.example.demo.repository.UserRepository;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ReminderService(ReminderRepository reminderRepository,
                           UserRepository userRepository,
                           NotificationService notificationService) {
        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Reminder createReminder(String patientEmail, ReminderRequest request) {
        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (patient.getRole() != Role.PATIENT) {
            throw new RuntimeException("Only patients can create reminders");
        }
        if (request.getType() == null) {
            throw new RuntimeException("Reminder type is required");
        }
        if (request.getDueDate() == null) {
            throw new RuntimeException("Due date is required");
        }

        Reminder reminder = new Reminder();
        reminder.setPatient(patient);
        reminder.setType(request.getType());
        reminder.setDueDate(request.getDueDate());
        reminder.setMessage(buildMessage(request));
        reminder.setNotified(false);
        reminder.setCreatedAt(LocalDateTime.now());
        return reminderRepository.save(reminder);
    }

    public List<Reminder> getMyReminders(String patientEmail) {
        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (patient.getRole() != Role.PATIENT) {
            throw new RuntimeException("Unauthorized");
        }
        return reminderRepository.findByPatientOrderByDueDateAsc(patient);
    }

    // Runs every hour and sends reminders due today or in the past.
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void sendDueReminders() {
        LocalDate today = LocalDate.now();
        List<Reminder> due = reminderRepository.findByNotifiedFalseAndDueDateLessThanEqual(today);

        for (Reminder reminder : due) {
            User patient = reminder.getPatient();
            String message = "Reminder: " + reminder.getMessage() + " (Due: " + reminder.getDueDate() + ")";
            notificationService.createNotification(
                    patient,
                    null,
                    "HEALTH_REMINDER",
                    message,
                    null
            );
            reminder.setNotified(true);
            reminder.setNotifiedAt(LocalDateTime.now());
        }
        reminderRepository.saveAll(due);
    }

    private String buildMessage(ReminderRequest request) {
        if (request.getMessage() != null && !request.getMessage().isBlank()) {
            return request.getMessage().trim();
        }

        return switch (request.getType()) {
            case APPOINTMENT -> "You have an upcoming appointment";
            case PRESCRIPTION_REFILL -> "Your prescription refill is due";
            case HEALTH_CHECKUP -> "Your routine health checkup is due";
        };
    }
}
