package com.example.demo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
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
    private final String googleApiKey;

    public ReminderService(ReminderRepository reminderRepository,
                           UserRepository userRepository,
                           NotificationService notificationService,
                           @Value("${google.api.key:}") String googleApiKey) {
        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.googleApiKey = googleApiKey;
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
            String calendarLink = buildGoogleCalendarLink(reminder);
            notificationService.createNotification(
                    patient,
                    null,
                    "HEALTH_REMINDER",
                    message,
                    null,
                    calendarLink
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

    private String buildGoogleCalendarLink(Reminder reminder) {
        LocalDateTime start = reminder.getDueDate().atTime(9, 0);
        LocalDateTime end = start.plusMinutes(30);

        DateTimeFormatter utcFormat = new DateTimeFormatterBuilder()
                .appendPattern("yyyyMMdd'T'HHmmss'Z'")
                .toFormatter()
                .withZone(ZoneOffset.UTC);

        String startUtc = utcFormat.format(start.atZone(ZoneId.systemDefault()).toInstant());
        String endUtc = utcFormat.format(end.atZone(ZoneId.systemDefault()).toInstant());

        String title = urlEncode("MedVault Reminder: " + reminder.getMessage());
        String details = urlEncode("Reminder created in MedVault. Due on " + reminder.getDueDate());

        StringBuilder url = new StringBuilder("https://calendar.google.com/calendar/render?action=TEMPLATE");
        url.append("&text=").append(title);
        url.append("&details=").append(details);
        url.append("&dates=").append(startUtc).append("/").append(endUtc);
        if (googleApiKey != null && !googleApiKey.isBlank()) {
            url.append("&key=").append(urlEncode(googleApiKey));
        }
        return url.toString();
    }

    private String urlEncode(String value) {
        try {
            return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }
}
