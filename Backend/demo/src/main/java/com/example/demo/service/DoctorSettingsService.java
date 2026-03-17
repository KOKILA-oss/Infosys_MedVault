package com.example.demo.service;

import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.DoctorSettingsRequest;
import com.example.demo.entity.DoctorSettings;
import com.example.demo.entity.User;
import com.example.demo.repository.DoctorSettingsRepository;
import com.example.demo.repository.UserRepository;

@Service
public class DoctorSettingsService {

    private final UserRepository userRepository;
    private final DoctorSettingsRepository doctorSettingsRepository;

    public DoctorSettingsService(
            UserRepository userRepository,
            DoctorSettingsRepository doctorSettingsRepository) {
        this.userRepository = userRepository;
        this.doctorSettingsRepository = doctorSettingsRepository;
    }

    public DoctorSettings getMySettings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return doctorSettingsRepository.findByUser(user)
                .orElseGet(() -> doctorSettingsRepository.save(createDefaultSettings(user)));
    }

    @Transactional
    public DoctorSettings updateMySettings(String email, DoctorSettingsRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        DoctorSettings settings = doctorSettingsRepository.findByUser(user)
                .orElseGet(() -> createDefaultSettings(user));

        settings.setUser(user);
        settings.setAppointmentNotifications(request.isAppointmentNotifications());
        settings.setReportNotifications(request.isReportNotifications());
        settings.setScheduleReminders(request.isScheduleReminders());
        settings.setAvailabilityVisible(request.isAvailabilityVisible());
        settings.setThemePreference(normalizeTheme(request.getThemePreference()));

        return doctorSettingsRepository.save(settings);
    }

    private DoctorSettings createDefaultSettings(User user) {
        DoctorSettings settings = new DoctorSettings();
        settings.setUser(user);
        settings.setThemePreference("light");
        return settings;
    }

    private String normalizeTheme(String themePreference) {
        String theme = themePreference == null ? "light" : themePreference.trim().toLowerCase(Locale.ROOT);
        return "dark".equals(theme) ? "dark" : "light";
    }
}
