package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.entity.Appointment;
import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public Notification createNotification(User recipient,
                                           User sender,
                                           String type,
                                           String message,
                                           Appointment appointment) {
        return createNotification(recipient, sender, type, message, appointment, null);
    }

    public Notification createNotification(User recipient,
                                           User sender,
                                           String type,
                                           String message,
                                           Appointment appointment,
                                           String link) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setSender(sender);
        n.setType(type);
        n.setMessage(message);
        n.setLink(link);
        n.setAppointment(appointment);
        n.setReadStatus(false);
        n.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(n);
    }

    public Notification notifyDoctorAboutSharedReport(String patientEmail,
                                                      String doctorEmail,
                                                      String doctorName,
                                                      String fileName) {
        User sender = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        User recipient = userRepository.findByEmail(doctorEmail)
                .orElseGet(() -> {
                    if (doctorName == null || doctorName.trim().isEmpty()) {
                        throw new RuntimeException("Doctor not found");
                    }
                    User byName = userRepository.findByNameIgnoreCase(doctorName.trim());
                    if (byName == null) {
                        throw new RuntimeException("Doctor not found");
                    }
                    return byName;
                });

        String patientName = sender.getName() == null || sender.getName().trim().isEmpty()
                ? sender.getEmail()
                : sender.getName().trim();
        String safeFileName = fileName == null || fileName.trim().isEmpty() ? "a test report" : fileName.trim();

        return createNotification(
                recipient,
                sender,
                "REPORT_SHARED",
                patientName + " shared " + safeFileName + " with you.",
                null
        );
    }

    public void markAllAsRead(String email) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    List<Notification> list =
            notificationRepository.findByRecipientOrderByCreatedAtDesc(user);

    for (Notification n : list) {
        n.setReadStatus(true);
    }

    notificationRepository.saveAll(list);
}

    public List<Notification> getNotificationsForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.countByRecipientAndReadStatusFalse(user);
    }

    public void markAsRead(Long id, String userEmail) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!n.getRecipient().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        n.setReadStatus(true);
        notificationRepository.save(n);
    }
}
