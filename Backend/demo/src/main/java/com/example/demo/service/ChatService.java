package com.example.demo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.demo.dto.AppointmentStatus;
import com.example.demo.entity.Appointment;
import com.example.demo.entity.User;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;

@Service
public class ChatService {

    private static final String URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final Pattern DOCTOR_PATTERN = Pattern.compile(
            "(?:doctor|dr\\.?)(?:\\s+name)?\\s*[:\\-]?\\s*([A-Za-z][A-Za-z\\s]{1,60})",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern DATE_PATTERN = Pattern.compile("\\b(\\d{4}-\\d{2}-\\d{2})\\b");
    private static final Pattern TIME_PATTERN = Pattern.compile(
            "\\b(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?|\\d{1,2}:\\d{2})\\b",
            Pattern.CASE_INSENSITIVE
    );

    @Value("${openrouter.api.key}")
    private String apiKey;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getChatResponse(String userMessage, String token) {

        try {
            String email = jwtUtil.extractEmail(token);
            User patient = userRepository.findByEmail(email).orElse(null);

            if (patient == null) {
                return "User not found.";
            }

            String normalizedMessage = userMessage == null ? "" : userMessage.trim();
            String lowerMessage = normalizedMessage.toLowerCase(Locale.ROOT);

            if (isAppointmentQuery(lowerMessage)) {
                return getAppointments(patient);
            }

            BookingDetails bookingDetails = extractBookingDetails(normalizedMessage);
            if (bookingDetails != null) {
                return bookAppointment(
                        patient,
                        bookingDetails.doctorName(),
                        bookingDetails.date(),
                        bookingDetails.time()
                );
            }

            if (lowerMessage.contains("book")) {
                return "Sure. Please provide doctor name, date and time in this format: Doctor Kritii, 2026-03-21, 10:00.";
            }

            return askAI(userMessage);

        } catch (Exception e) {
            return "Unable to process your request right now.";
        }
    }

    private String askAI(String userMessage) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        String body = """
        {
          "model": "openai/gpt-3.5-turbo",
          "messages":[
            {
              "role":"system",
              "content":"You are MedVault healthcare assistant. 
              Help patients understand appointments but do not perform bookings."
            },
            {
              "role":"user",
              "content":"%s"
            }
          ]
        }
        """.formatted(userMessage);

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response =
                restTemplate.postForEntity(URL, entity, String.class);

        return response.getBody();
    }

    private String getAppointments(User patient) {

        List<Appointment> appointments =
                appointmentRepository
                        .findByPatientAndAppointmentDateGreaterThanEqual(patient, LocalDate.now())
                        .stream()
                        .sorted(Comparator
                                .comparing(Appointment::getAppointmentDate)
                                .thenComparing(Appointment::getAppointmentTime))
                        .toList();

        if (appointments.isEmpty()) {
            return "You have no upcoming appointments.";
        }

        StringBuilder builder = new StringBuilder();
        builder.append("Here are your upcoming appointments:\n");

        int i = 1;
        for (Appointment appointment : appointments) {
            builder.append(i++)
                    .append(". Dr. ")
                    .append(appointment.getDoctor().getName())
                    .append(" on ")
                    .append(appointment.getAppointmentDate())
                    .append(" at ")
                    .append(appointment.getAppointmentTime())
                    .append("\n");
        }

        return builder.toString();
    }

    private String bookAppointment(User patient, String doctorName, LocalDate date, LocalTime time) {

        User doctor = findDoctorByName(doctorName);

        if (doctor == null) {
            return "Doctor not found.";
        }

        if (doctor.getRole() == null || !"DOCTOR".equals(doctor.getRole().name())) {
            return "Selected user is not a doctor.";
        }

        if (date.isBefore(LocalDate.now())) {
            return "Please provide a future appointment date.";
        }

        boolean exists = appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(
                doctor,
                date,
                time
        );

        if (exists) {
            return "That slot is already booked. Please choose another time.";
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(date);
        appointment.setAppointmentTime(time);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setReason("Booked via chatbot");

        appointmentRepository.save(appointment);

        return "Appointment booked successfully with Dr. "
                + doctor.getName()
                + " on "
                + date
                + " at "
                + time
                + ". Status: PENDING";
    }

    private boolean isAppointmentQuery(String lowerMessage) {
        return lowerMessage.contains("upcoming appointment")
                || lowerMessage.contains("upcoming appointments")
                || lowerMessage.contains("my appointments")
                || lowerMessage.contains("show appointments")
                || lowerMessage.contains("list appointments");
    }

    private BookingDetails extractBookingDetails(String message) {
        Matcher doctorMatcher = DOCTOR_PATTERN.matcher(message);
        Matcher dateMatcher = DATE_PATTERN.matcher(message);
        Matcher timeMatcher = TIME_PATTERN.matcher(message);

        if (!doctorMatcher.find() || !dateMatcher.find() || !timeMatcher.find()) {
            return null;
        }

        String doctorName = normalizeDoctorName(doctorMatcher.group(1));

        try {
            LocalDate date = LocalDate.parse(dateMatcher.group(1));
            LocalTime time = parseTimeValue(timeMatcher.group(1));
            return new BookingDetails(doctorName, date, time);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private String normalizeDoctorName(String rawDoctorName) {
        return rawDoctorName
                .replaceAll("\\s+", " ")
                .replaceAll("(?i)\\b(on|at|for|date|time)\\b.*$", "")
                .trim();
    }

    private LocalTime parseTimeValue(String rawTime) {
        String normalized = rawTime.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "");

        if (normalized.endsWith("am") || normalized.endsWith("pm")) {
            boolean isPm = normalized.endsWith("pm");
            String timePortion = normalized.substring(0, normalized.length() - 2);
            String[] pieces = timePortion.split(":");
            int hour = Integer.parseInt(pieces[0]);
            int minute = pieces.length > 1 ? Integer.parseInt(pieces[1]) : 0;

            if (hour == 12) {
                hour = isPm ? 12 : 0;
            } else if (isPm) {
                hour += 12;
            }

            return LocalTime.of(hour, minute);
        }

        if (!normalized.contains(":")) {
            normalized = normalized + ":00";
        }

        return LocalTime.parse(normalized);
    }

    private User findDoctorByName(String doctorName) {
        User exact = userRepository.findByNameIgnoreCase(doctorName);
        if (exact != null) {
            return exact;
        }

        return userRepository.findFirstByNameContainingIgnoreCase(doctorName).orElse(null);
    }

    private record BookingDetails(String doctorName, LocalDate date, LocalTime time) {
    }
}
