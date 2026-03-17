package com.example.demo.service;

import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.PatientSettingsRequest;
import com.example.demo.entity.PatientSettings;
import com.example.demo.entity.User;
import com.example.demo.repository.PatientSettingsRepository;
import com.example.demo.repository.UserRepository;

@Service
public class PatientSettingsService {

    private final UserRepository userRepository;
    private final PatientSettingsRepository patientSettingsRepository;

    public PatientSettingsService(
            UserRepository userRepository,
            PatientSettingsRepository patientSettingsRepository) {
        this.userRepository = userRepository;
        this.patientSettingsRepository = patientSettingsRepository;
    }

    public PatientSettings getMySettings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return patientSettingsRepository.findByUser(user)
                .orElseGet(() -> patientSettingsRepository.save(createDefaultSettings(user)));
    }

    @Transactional
    public PatientSettings updateMySettings(String email, PatientSettingsRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PatientSettings settings = patientSettingsRepository.findByUser(user)
                .orElseGet(() -> createDefaultSettings(user));

        settings.setUser(user);
        settings.setAppointmentNotifications(request.isAppointmentNotifications());
        settings.setReportNotifications(request.isReportNotifications());
        settings.setReminderNotifications(request.isReminderNotifications());
        settings.setDataSharingEnabled(request.isDataSharingEnabled());
        settings.setChatbotEnabled(request.isChatbotEnabled());
        settings.setThemePreference(normalizeTheme(request.getThemePreference()));

        return patientSettingsRepository.save(settings);
    }

    private PatientSettings createDefaultSettings(User user) {
        PatientSettings settings = new PatientSettings();
        settings.setUser(user);
        settings.setThemePreference("light");
        return settings;
    }

    private String normalizeTheme(String themePreference) {
        String theme = themePreference == null ? "light" : themePreference.trim().toLowerCase(Locale.ROOT);
        return "dark".equals(theme) ? "dark" : "light";
    }
}
