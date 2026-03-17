package com.example.demo.service;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.demo.dto.AppointmentStatus;
import com.example.demo.entity.Appointment;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;

@Service
public class ChatService {

    private static final String URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final Pattern DATE_DMY_PATTERN =
            Pattern.compile("\\b(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{2,4}))?\\b");
    private static final Pattern TIME_12H_PATTERN =
            Pattern.compile("\\b(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern TIME_24H_PATTERN =
            Pattern.compile("\\b([01]?\\d|2[0-3]):([0-5]\\d)\\b");

    @Value("${openrouter.api.key}")
    private String apiKey;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    private final Map<String, Boolean> awaitingBookingDetailsByEmail = new ConcurrentHashMap<>();
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getChatResponse(String userMessage, String token) {
        try {
            if (token == null || token.isBlank()) {
                return "Please log in again and retry.";
            }

            String email = jwtUtil.extractEmail(token);
            User patient = userRepository.findByEmail(email).orElse(null);
            if (patient == null) {
                return "User not found.";
            }

            String normalized = normalize(userMessage);

            BookingInput parsed = parseBookingInput(userMessage);
            if (parsed.isComplete()) {
                awaitingBookingDetailsByEmail.put(email, false);
                return bookAppointment(patient, parsed.doctorName, parsed.date, parsed.time, parsed.reason);
            }

            boolean bookingIntent = isBookingIntent(normalized);
            boolean awaitingDetails = awaitingBookingDetailsByEmail.getOrDefault(email, false);
            if (bookingIntent || awaitingDetails) {
                awaitingBookingDetailsByEmail.put(email, true);
                return buildBookingPrompt(parsed);
            }

            if (isGreetingIntent(normalized)) {
                return "Hello! How can I help you today? I can show your upcoming appointments or book a new one (doctor, date, time, reason).";
            }

            if (isUpcomingAppointmentsIntent(normalized)) {
                return getAppointments(patient);
            }

            return askAI(userMessage);
        } catch (Exception e) {
            return "Unable to process your request right now.";
        }
    }

    private String askAI(String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return "I can help with appointments. Ask me about upcoming appointments or booking a visit.";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        String body = """
        {
          "model": "openai/gpt-3.5-turbo",
          "messages":[
            {
              "role":"system",
              "content":"You are MedVault healthcare assistant. Help patients understand appointments but do not perform bookings."
            },
            {
              "role":"user",
              "content":"%s"
            }
          ]
        }
        """.formatted(userMessage);

        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(URL, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isTextual() && !content.asText().isBlank()) {
                return content.asText();
            }
        } catch (Exception ignored) {
            return "I can help with appointments. Ask me for your upcoming appointments or say: book appointment with doctor name, date, time, and reason (comma separated).";
        }

        return "I can help with appointments. Ask me for your upcoming appointments or say: book appointment with doctor name, date, time, and reason (comma separated).";
    }

    private String getAppointments(User patient) {
        List<Appointment> appointments = new ArrayList<>(
                appointmentRepository.findByPatientAndAppointmentDateGreaterThanEqual(patient, LocalDate.now())
        );

        appointments.sort(
                Comparator.comparing(Appointment::getAppointmentDate)
                        .thenComparing(Appointment::getAppointmentTime)
        );

        if (appointments.isEmpty()) {
            return "You have no upcoming appointments.";
        }

        StringBuilder builder = new StringBuilder();
        builder.append("Here are your upcoming appointments:\n");

        int i = 1;
        for (Appointment appointment : appointments) {
            String doctorName = cleanupDoctorName(appointment.getDoctor().getName());
            String day = appointment.getAppointmentDate().getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            String date = appointment.getAppointmentDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
            String time = appointment.getAppointmentTime().format(DateTimeFormatter.ofPattern("hh:mm a"));
            String status = appointment.getStatus() == null ? "PENDING" : appointment.getStatus().name();

            builder.append(i++)
                    .append(". Dr. ")
                    .append(doctorName)
                    .append(" - ")
                    .append(day)
                    .append(", ")
                    .append(date)
                    .append(" at ")
                    .append(time)
                    .append(" (")
                    .append(status)
                    .append(")\n");
        }

        return builder.toString();
    }

    private String bookAppointment(User patient, String doctorName, LocalDate date, LocalTime time, String reasonText) {
        User doctor = findDoctorByName(doctorName);
        if (doctor == null) {
            return "Doctor not found.";
        }

        if (doctor.getRole() != Role.DOCTOR) {
            return "Selected user is not a doctor.";
        }

        if (date.isBefore(LocalDate.now())) {
            return "Cannot book in the past. Please provide a future date.";
        }

        if (appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(doctor, date, time)) {
            return "That slot is already booked. Please choose another time.";
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(date);
        appointment.setAppointmentTime(time);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setReason(buildChatbotReason(reasonText));

        appointmentRepository.save(appointment);

        return "Appointment booked successfully with Dr. "
                + cleanupDoctorName(doctor.getName())
                + " on "
                + date.format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
                + " at "
                + time.format(DateTimeFormatter.ofPattern("hh:mm a"))
                + ". Reason: "
                + buildChatbotReason(reasonText)
                + ". Status: PENDING";
    }

    private boolean isUpcomingAppointmentsIntent(String message) {
        return (message.contains("upcoming") || message.contains("next") || message.contains("my"))
                && (message.contains("appointment") || message.contains("appoint"));
    }

    private boolean isGreetingIntent(String message) {
        return Pattern.compile("\\b(hi|hello|hey)\\b", Pattern.CASE_INSENSITIVE)
                .matcher(message == null ? "" : message)
                .find();
    }

    private boolean isBookingIntent(String message) {
        return message.contains("book")
                || message.contains("schedule")
                || message.contains("fix an appointment")
                || message.contains("fix appointment")
                || message.contains("set an appointment")
                || message.contains("set appointment")
                || message.contains("arrange appointment");
    }

    private BookingInput parseBookingInput(String message) {
        if (message == null) {
            return new BookingInput("", null, null, "");
        }

        String[] parts = message.split(",");
        if (parts.length >= 4) {
            String doctorName = parts[0].trim();
            LocalDate date = extractDate(parts[1]);
            LocalTime time = extractTime(parts[2]);
            String reason = String.join(",", Arrays.copyOfRange(parts, 3, parts.length)).trim();
            return new BookingInput(doctorName, date, time, reason);
        }

        LocalDate date = extractDate(message);
        LocalTime time = extractTime(message);
        String doctorName = extractDoctorName(message);
        String reason = extractReason(message, doctorName, date, time);
        return new BookingInput(doctorName, date, time, reason);
    }

    private LocalDate extractDate(String message) {
        String text = normalize(message);

        Matcher dmy = DATE_DMY_PATTERN.matcher(text);
        if (dmy.find()) {
            int day = Integer.parseInt(dmy.group(1));
            int month = Integer.parseInt(dmy.group(2));
            String yearToken = dmy.group(3);
            int year = yearToken == null ? LocalDate.now().getYear() : Integer.parseInt(yearToken);
            if (year < 100) {
                year += 2000;
            }
            try {
                return LocalDate.of(year, month, day);
            } catch (DateTimeException ignored) {
                return null;
            }
        }

        Map<String, Integer> months = monthMap();
        for (Map.Entry<String, Integer> entry : months.entrySet()) {
            if (!text.contains(entry.getKey())) {
                continue;
            }

            Matcher dayMatcher = Pattern.compile("\\b(\\d{1,2})(?:st|nd|rd|th)?\\b").matcher(text);
            int day = -1;
            if (dayMatcher.find()) {
                day = Integer.parseInt(dayMatcher.group(1));
            }
            if (day == -1) {
                continue;
            }

            Matcher yearMatcher = Pattern.compile("\\b(20\\d{2})\\b").matcher(text);
            int year = LocalDate.now().getYear();
            if (yearMatcher.find()) {
                year = Integer.parseInt(yearMatcher.group(1));
            }

            try {
                return LocalDate.of(year, entry.getValue(), day);
            } catch (DateTimeException ignored) {
                return null;
            }
        }

        return null;
    }

    private LocalTime extractTime(String message) {
        String text = normalize(message);

        Matcher h12 = TIME_12H_PATTERN.matcher(text);
        if (h12.find()) {
            int hour = Integer.parseInt(h12.group(1));
            int minute = h12.group(2) == null ? 0 : Integer.parseInt(h12.group(2));
            String ampm = h12.group(3).toLowerCase(Locale.ROOT);

            if (hour == 12) {
                hour = 0;
            }
            if ("pm".equals(ampm)) {
                hour += 12;
            }
            return LocalTime.of(hour, minute);
        }

        Matcher h24 = TIME_24H_PATTERN.matcher(text);
        if (h24.find()) {
            int hour = Integer.parseInt(h24.group(1));
            int minute = Integer.parseInt(h24.group(2));
            return LocalTime.of(hour, minute);
        }

        return null;
    }

    private String extractDoctorName(String message) {
        String normalizedMessage = normalizeDoctorName(message);
        if (!normalizedMessage.isBlank()) {
            List<User> allUsers = userRepository.findAll();
            for (User user : allUsers) {
                if (user.getRole() != Role.DOCTOR || user.getName() == null) {
                    continue;
                }
                String candidate = normalizeDoctorName(user.getName());
                if (!candidate.isBlank() && normalizedMessage.contains(candidate)) {
                    return user.getName();
                }
            }
        }

        String cleaned = message
                .replaceAll("(?i)\\b(book|appointment|appoint|schedule|on|at|for|with|dr\\.?|doctor|please|just|nothing|specific)\\b", " ")
                .replaceAll("(?i)\\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\\b", " ")
                .replaceAll("\\d{1,2}([/-]\\d{1,2}){1,2}", " ")
                .replaceAll("\\b\\d{1,2}(:\\d{2})?\\s*(am|pm)\\b", " ")
                .replaceAll("\\b\\d{1,2}\\b", " ")
                .replaceAll("\\b([01]?\\d|2[0-3]):([0-5]\\d)\\b", " ")
                .replaceAll("[,.\\/-]", " ")
                .replaceAll("\\s+", " ")
                .trim();

        if (cleaned.isBlank()) {
            return "";
        }

        String[] tokens = cleaned.split(" ");
        return tokens[tokens.length - 1];
    }

    private String extractReason(String message, String doctorName, LocalDate date, LocalTime time) {
        if (message == null) {
            return "";
        }

        String reason = message;

        if (doctorName != null && !doctorName.isBlank()) {
            String doctorPattern = Pattern.quote(doctorName);
            reason = reason.replaceAll("(?i)dr\\.\\s*" + doctorPattern, " ");
            reason = reason.replaceAll("(?i)" + doctorPattern, " ");
        }

        if (date != null) {
            reason = reason.replace(date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), " ");
            reason = reason.replace(date.format(DateTimeFormatter.ofPattern("d/M/yyyy")), " ");
            reason = reason.replace(date.format(DateTimeFormatter.ISO_LOCAL_DATE), " ");
            reason = reason.replace(date.format(DateTimeFormatter.ofPattern("dd MMM yyyy")), " ");
        }

        if (time != null) {
            reason = reason.replace(time.format(DateTimeFormatter.ofPattern("HH:mm")), " ");
            reason = reason.replace(time.format(DateTimeFormatter.ofPattern("hh:mm a")), " ");
        }

        reason = reason.replaceAll("\\s+", " ").trim();
        return reason;
    }

    private User findDoctorByName(String rawName) {
        String target = normalizeDoctorName(rawName);
        if (target.isBlank()) {
            return null;
        }

        User exact = userRepository.findByNameIgnoreCase(target);
        if (exact != null && exact.getRole() == Role.DOCTOR) {
            return exact;
        }

        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            if (user.getRole() != Role.DOCTOR || user.getName() == null) {
                continue;
            }
            String candidate = normalizeDoctorName(user.getName());
            if (candidate.equals(target) || candidate.contains(target) || target.contains(candidate)) {
                return user;
            }
        }

        return null;
    }

    private String normalizeDoctorName(String value) {
        if (value == null) {
            return "";
        }

        String normalized = value.toLowerCase(Locale.ROOT)
                .replace("dr.", "")
                .replace("dr", "")
                .replaceAll("[^a-z]", "")
                .trim();
        return normalized.replaceAll("(.)\\1+", "$1");
    }

    private String cleanupDoctorName(String name) {
        if (name == null) {
            return "";
        }
        return name.replaceFirst("(?i)^\\s*dr\\.?\\s*", "").trim();
    }

    private String normalize(String input) {
        return input == null ? "" : input.toLowerCase(Locale.ROOT);
    }

    private String buildChatbotReason(String userMessage) {
        String cleaned = userMessage == null ? "" : userMessage.trim();
        if (cleaned.isBlank()) {
            return "Booked via chatbot";
        }
        if (cleaned.length() > 180) {
            return cleaned.substring(0, 180);
        }
        return cleaned;
    }

    private Map<String, Integer> monthMap() {
        Map<String, Integer> map = new HashMap<>();
        map.put("january", 1);
        map.put("jan", 1);
        map.put("february", 2);
        map.put("feb", 2);
        map.put("march", 3);
        map.put("mar", 3);
        map.put("april", 4);
        map.put("apr", 4);
        map.put("may", 5);
        map.put("june", 6);
        map.put("jun", 6);
        map.put("july", 7);
        map.put("jul", 7);
        map.put("august", 8);
        map.put("aug", 8);
        map.put("september", 9);
        map.put("sep", 9);
        map.put("sept", 9);
        map.put("october", 10);
        map.put("oct", 10);
        map.put("november", 11);
        map.put("nov", 11);
        map.put("december", 12);
        map.put("dec", 12);
        return map;
    }

    private static class BookingInput {
        private final String doctorName;
        private final LocalDate date;
        private final LocalTime time;
        private final String reason;
        private final boolean hasDoctor;
        private final boolean hasDate;
        private final boolean hasTime;
        private final boolean hasReason;

        private BookingInput(String doctorName, LocalDate date, LocalTime time, String reason) {
            this.doctorName = doctorName;
            this.date = date;
            this.time = time;
            this.reason = reason;
            this.hasDoctor = doctorName != null && !doctorName.isBlank();
            this.hasDate = date != null;
            this.hasTime = time != null;
            this.hasReason = reason != null && !reason.isBlank();
        }

        private boolean isComplete() {
            return hasDoctor && hasDate && hasTime && hasReason;
        }
    }

    private String buildBookingPrompt(BookingInput parsed) {
        StringBuilder builder = new StringBuilder("Please add the missing details (doctor, date, time, reason) in one comma-separated line.");
        if (parsed != null) {
            builder.append(" Missing:");
            if (!parsed.hasDoctor) builder.append(" doctor name");
            if (!parsed.hasDate) builder.append(" date");
            if (!parsed.hasTime) builder.append(" time");
            if (!parsed.hasReason) builder.append(" reason");
            builder.append(".");
        }
        builder.append(" Example: Dr. Aashish, 28/03/2026, 3:00 PM, Knee pain follow-up");
        return builder.toString();
    }
}
