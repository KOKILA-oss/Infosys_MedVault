package com.example.demo.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.AppointmentAvailabilityResponse;
import com.example.demo.dto.DoctorDayScheduleConfig;
import com.example.demo.dto.DoctorScheduleConfigRequest;
import com.example.demo.dto.DoctorScheduleSlot;
import com.example.demo.dto.AppointmentStatus;
import com.example.demo.entity.Appointment;
import com.example.demo.entity.DoctorScheduleConfig;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.DoctorScheduleConfigRepository;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DoctorScheduleService {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final DoctorScheduleConfigRepository doctorScheduleConfigRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final ObjectMapper objectMapper;

    public DoctorScheduleService(DoctorScheduleConfigRepository doctorScheduleConfigRepository,
                                 UserRepository userRepository,
                                 AppointmentRepository appointmentRepository,
                                 ObjectMapper objectMapper) {
        this.doctorScheduleConfigRepository = doctorScheduleConfigRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.objectMapper = objectMapper;
    }

    public DoctorScheduleConfigRequest getDoctorSchedule(String doctorEmail) {
        User doctor = getDoctorByEmail(doctorEmail);
        return toResponse(doctorScheduleConfigRepository.findByDoctor(doctor).orElseGet(() -> createDefaultConfig(doctor)));
    }

    @Transactional
    public DoctorScheduleConfigRequest updateDoctorSchedule(String doctorEmail, DoctorScheduleConfigRequest request) {
        User doctor = getDoctorByEmail(doctorEmail);
        DoctorScheduleConfig config = doctorScheduleConfigRepository.findByDoctor(doctor).orElseGet(() -> createDefaultConfig(doctor));

        List<DoctorScheduleSlot> defaultSlots = sanitizeSlots(request.getDefaultSlots());
        List<Integer> defaultActiveDays = sanitizeActiveDays(request.getDefaultActiveDays());
        Map<String, DoctorDayScheduleConfig> dayConfigs = sanitizeDayConfigs(request.getDayConfigs());

        config.setDoctor(doctor);
        config.setDefaultSlotsJson(writeJson(defaultSlots));
        config.setDefaultActiveDaysCsv(defaultActiveDays.stream().map(String::valueOf).collect(Collectors.joining(",")));
        config.setDayConfigsJson(writeJson(dayConfigs));

        return toResponse(doctorScheduleConfigRepository.save(config));
    }

    public AppointmentAvailabilityResponse getAvailability(Long doctorId, LocalDate date) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException("Selected user is not a doctor");
        }

        DoctorScheduleConfigRequest config = toResponse(
                doctorScheduleConfigRepository.findByDoctor(doctor).orElseGet(() -> createDefaultConfig(doctor))
        );
        return buildAvailabilityResponse(doctor, date, config);
    }

    public void validateRequestedAppointment(User doctor, LocalDate date, LocalTime time, Long ignoreAppointmentId) {
        AppointmentAvailabilityResponse availability = getAvailability(doctor.getId(), date);
        String formattedTime = time.format(TIME_FORMATTER);

        List<String> allowedSlots = ignoreAppointmentId == null
                ? availability.getAvailableSlots()
                : buildAvailableSlotsForReschedule(doctor, date, ignoreAppointmentId);

        if (!allowedSlots.contains(formattedTime)) {
            if (availability.getUnavailableReason() != null && !availability.getUnavailableReason().isBlank()) {
                throw new RuntimeException(availability.getUnavailableReason());
            }
            throw new RuntimeException("The selected time is outside the doctor's available schedule.");
        }
    }

    private List<String> buildAvailableSlotsForReschedule(User doctor, LocalDate date, Long ignoreAppointmentId) {
        AppointmentAvailabilityResponse availability = getAvailability(doctor.getId(), date);
        List<String> slots = new ArrayList<>(availability.getAvailableSlots());

        appointmentRepository.findByDoctorAndAppointmentDate(doctor, date).stream()
                .filter(item -> item.getId().equals(ignoreAppointmentId))
                .map(Appointment::getAppointmentTime)
                .filter(value -> value != null)
                .map(value -> value.format(TIME_FORMATTER))
                .findFirst()
                .ifPresent((slot) -> {
                    if (!slots.contains(slot)) {
                        slots.add(slot);
                        slots.sort(String::compareTo);
                    }
                });

        return slots;
    }

    private AppointmentAvailabilityResponse buildAvailabilityResponse(User doctor, LocalDate date, DoctorScheduleConfigRequest config) {
        AppointmentAvailabilityResponse response = new AppointmentAvailabilityResponse();
        DoctorDayScheduleConfig dayConfig = config.getDayConfigs().getOrDefault(date.toString(), new DoctorDayScheduleConfig());

        if (dayConfig.isOffDay()) {
            response.setUnavailableReason("Doctor unavailable");
            return response;
        }

        List<DoctorScheduleSlot> effectiveSlots = !sanitizeSlots(dayConfig.getSlots()).isEmpty()
                ? sanitizeSlots(dayConfig.getSlots())
                : (isDefaultWorkingDay(date, config.getDefaultActiveDays()) ? sanitizeSlots(config.getDefaultSlots()) : List.of());

        if (effectiveSlots.isEmpty()) {
            response.setUnavailableReason("Doctor has not opened any appointment slots for this day.");
            return response;
        }

        Set<String> generatedSlots = new LinkedHashSet<>();
        for (DoctorScheduleSlot slot : effectiveSlots) {
            LocalTime start = parseTime(slot.getStart());
            LocalTime end = parseTime(slot.getEnd());
            if (start == null || end == null || !start.isBefore(end)) continue;

            LocalTime cursor = start;
            while (!cursor.plusMinutes(30).isAfter(end)) {
                generatedSlots.add(cursor.format(TIME_FORMATTER));
                cursor = cursor.plusMinutes(30);
            }
        }

        if (generatedSlots.isEmpty()) {
            response.setUnavailableReason("Doctor has not opened any 30-minute appointment slots for this day.");
            return response;
        }

        List<String> bookedTimes = appointmentRepository.findByDoctorAndAppointmentDate(doctor, date).stream()
                .filter(item -> item.getStatus() != AppointmentStatus.CANCELLED)
                .filter(item -> item.getAppointmentTime() != null)
                .map(item -> item.getAppointmentTime().format(TIME_FORMATTER))
                .toList();

        List<String> availableSlots = generatedSlots.stream()
                .filter(slot -> !bookedTimes.contains(slot))
                .filter(slot -> isFutureOrCurrentSlot(date, slot))
                .sorted()
                .toList();

        response.setAvailableSlots(availableSlots);
        if (availableSlots.isEmpty()) {
            response.setUnavailableReason("All available slots for this day are already booked.");
        }
        return response;
    }

    private boolean isDefaultWorkingDay(LocalDate date, List<Integer> defaultActiveDays) {
        int weekday = toFrontendWeekday(date.getDayOfWeek());
        return defaultActiveDays.contains(weekday);
    }

    private int toFrontendWeekday(DayOfWeek dayOfWeek) {
        return dayOfWeek.getValue() % 7;
    }

    private DoctorScheduleConfig createDefaultConfig(User doctor) {
        DoctorScheduleConfig config = new DoctorScheduleConfig();
        config.setDoctor(doctor);
        config.setDefaultSlotsJson(writeJson(defaultSlots()));
        config.setDefaultActiveDaysCsv("1,2,3,4,5");
        config.setDayConfigsJson("{}");
        return doctorScheduleConfigRepository.save(config);
    }

    private DoctorScheduleConfigRequest toResponse(DoctorScheduleConfig config) {
        DoctorScheduleConfigRequest response = new DoctorScheduleConfigRequest();
        response.setDefaultSlots(readSlots(config.getDefaultSlotsJson()));
        response.setDefaultActiveDays(readActiveDays(config.getDefaultActiveDaysCsv()));
        response.setDayConfigs(readDayConfigs(config.getDayConfigsJson()));
        return response;
    }

    private List<DoctorScheduleSlot> defaultSlots() {
        List<DoctorScheduleSlot> slots = new ArrayList<>();
        DoctorScheduleSlot morning = new DoctorScheduleSlot();
        morning.setId("default-morning");
        morning.setStart("09:00");
        morning.setEnd("12:00");
        slots.add(morning);

        DoctorScheduleSlot afternoon = new DoctorScheduleSlot();
        afternoon.setId("default-afternoon");
        afternoon.setStart("13:00");
        afternoon.setEnd("17:00");
        slots.add(afternoon);
        return slots;
    }

    private List<DoctorScheduleSlot> sanitizeSlots(List<DoctorScheduleSlot> slots) {
        if (slots == null) return List.of();
        return slots.stream()
                .filter(item -> parseTime(item.getStart()) != null && parseTime(item.getEnd()) != null)
                .filter(item -> parseTime(item.getStart()).isBefore(parseTime(item.getEnd())))
                .sorted(Comparator.comparing(DoctorScheduleSlot::getStart))
                .toList();
    }

    private List<Integer> sanitizeActiveDays(List<Integer> days) {
        if (days == null || days.isEmpty()) return List.of(1, 2, 3, 4, 5);
        return days.stream()
                .filter(item -> item != null && item >= 0 && item <= 6)
                .distinct()
                .sorted()
                .toList();
    }

    private Map<String, DoctorDayScheduleConfig> sanitizeDayConfigs(Map<String, DoctorDayScheduleConfig> dayConfigs) {
        if (dayConfigs == null) return Map.of();
        Map<String, DoctorDayScheduleConfig> sanitized = new HashMap<>();
        dayConfigs.forEach((dateKey, config) -> {
            if (dateKey == null || dateKey.isBlank() || config == null) return;
            DoctorDayScheduleConfig next = new DoctorDayScheduleConfig();
            next.setOffDay(config.isOffDay());
            next.setOffReason(config.getOffReason() == null ? "" : config.getOffReason().trim());
            next.setSlots(sanitizeSlots(config.getSlots()));
            sanitized.put(dateKey, next);
        });
        return sanitized;
    }

    private List<DoctorScheduleSlot> readSlots(String value) {
        try {
            return sanitizeSlots(objectMapper.readValue(value, new TypeReference<List<DoctorScheduleSlot>>() { }));
        } catch (Exception ignored) {
            return defaultSlots();
        }
    }

    private List<Integer> readActiveDays(String value) {
        try {
            return sanitizeActiveDays(
                    List.of(value.split(",")).stream()
                            .filter(item -> !item.isBlank())
                            .map(Integer::parseInt)
                            .toList()
            );
        } catch (Exception ignored) {
            return List.of(1, 2, 3, 4, 5);
        }
    }

    private Map<String, DoctorDayScheduleConfig> readDayConfigs(String value) {
        try {
            return sanitizeDayConfigs(objectMapper.readValue(value, new TypeReference<Map<String, DoctorDayScheduleConfig>>() { }));
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save doctor schedule");
        }
    }

    private LocalTime parseTime(String value) {
        try {
            return value == null || value.isBlank() ? null : LocalTime.parse(value, TIME_FORMATTER);
        } catch (Exception ignored) {
            return null;
        }
    }

    private boolean isFutureOrCurrentSlot(LocalDate date, String slot) {
        LocalTime slotTime = parseTime(slot);
        if (slotTime == null) {
            return false;
        }
        LocalDateTime slotDateTime = LocalDateTime.of(date, slotTime);
        return !slotDateTime.isBefore(LocalDateTime.now());
    }

    private User getDoctorByEmail(String email) {
        User doctor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException("User is not a doctor");
        }
        return doctor;
    }
}
