package com.example.demo.service;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
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

import com.example.demo.dto.AppointmentStatus;
import com.example.demo.entity.Appointment;
import com.example.demo.entity.DoctorProfile;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.DoctorProfileRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ChatService {

    private static final String URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter DISPLAY_TIME = DateTimeFormatter.ofPattern("hh:mm a");
    private static final Pattern DATE_DMY_PATTERN =
            Pattern.compile("\\b(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{2,4}))?\\b");
    private static final Pattern TIME_12H_PATTERN =
            Pattern.compile("\\b(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern TIME_24H_PATTERN =
            Pattern.compile("\\b([01]?\\d|2[0-3]):([0-5]\\d)\\b");
    private static final List<LocalTime> CLINIC_SLOTS = List.of(
            LocalTime.of(9, 0),
            LocalTime.of(10, 30),
            LocalTime.of(12, 0),
            LocalTime.of(15, 0),
            LocalTime.of(16, 30)
    );

    @Value("${openrouter.api.key}")
    private String apiKey;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    private final Map<String, BookingSession> bookingSessions = new ConcurrentHashMap<>();
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

            if (isBookingIntent(normalized) || bookingSessions.containsKey(email)) {
                return handleBookingConversation(patient, userMessage);
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

    private String handleBookingConversation(User patient, String userMessage) {
        String email = patient.getEmail();
        String normalized = normalize(userMessage);
        BookingSession session = bookingSessions.computeIfAbsent(email, key -> new BookingSession());

        if (normalized.contains("cancel booking") || normalized.equals("cancel") || normalized.equals("stop")) {
            bookingSessions.remove(email);
            return "Appointment booking stopped. Say 'book appointment' whenever you want to start again.";
        }

        if (session.reason == null || session.reason.isBlank()) {
            String extractedReason = extractReason(userMessage);
            if (extractedReason == null || extractedReason.isBlank() || isBookingIntent(normalized)) {
                return "What is the reason for the appointment? For example: chest pain, skin rash, fever, dental pain.";
            }

            session.reason = extractedReason;
            session.specialization = mapReasonToSpecialization(extractedReason);
            session.suggestedDoctors = findDoctorsForSpecialization(session.specialization);
            return buildDoctorSuggestionPrompt(session);
        }

        if (session.doctorId == null) {
            DoctorProfile selectedDoctor = resolveDoctorSelection(userMessage, session);
            if (selectedDoctor == null) {
                return buildDoctorSuggestionPrompt(session);
            }

            session.doctorId = selectedDoctor.getUser().getId();
            session.doctorName = selectedDoctor.getUser().getName();

            LocalDate parsedDate = extractDate(userMessage);
            LocalTime parsedTime = extractTime(userMessage);
            if (parsedDate != null) {
                session.date = parsedDate;
            }
            if (parsedTime != null) {
                session.time = parsedTime;
            }

            if (session.date == null) {
                return "Selected Dr. " + cleanupDoctorName(session.doctorName)
                        + ". What date would you prefer? Example: 28/03/2026";
            }
        }

        if (session.date == null) {
            LocalDate parsedDate = extractDate(userMessage);
            if (parsedDate == null) {
                return "Please provide the appointment date in a format like 28/03/2026.";
            }
            session.date = parsedDate;
        }

        if (session.date.isBefore(LocalDate.now())) {
            session.date = null;
            session.time = null;
            return "Cannot book in the past. Please provide a future date.";
        }

        List<LocalTime> availableSlots = getAvailableSlots(session.doctorId, session.date);
        if (availableSlots.isEmpty()) {
            session.time = null;
            return "No slots are available with Dr. " + cleanupDoctorName(session.doctorName)
                    + " on " + session.date.format(DISPLAY_DATE)
                    + ". Please choose another date.";
        }

        if (session.time == null) {
            LocalTime parsedTime = extractTime(userMessage);
            if (parsedTime != null) {
                session.time = parsedTime;
            } else {
                return buildTimePrompt(session.doctorName, session.date, availableSlots);
            }
        }

        if (!availableSlots.contains(session.time)) {
            session.time = null;
            return "That time is not available. " + buildTimePrompt(session.doctorName, session.date, availableSlots);
        }

        String confirmation = bookAppointment(patient, session);
        bookingSessions.remove(email);
        return confirmation;
    }

    private String askAI(String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return "I can help with appointments. Ask for upcoming appointments or say 'book appointment' to start.";
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
            return "I can help with appointments. Ask for upcoming appointments or say 'book appointment' to start.";
        }

        return "I can help with appointments. Ask for upcoming appointments or say 'book appointment' to start.";
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
            String date = appointment.getAppointmentDate().format(DISPLAY_DATE);
            String time = appointment.getAppointmentTime().format(DISPLAY_TIME);
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

    private String bookAppointment(User patient, BookingSession session) {
        User doctor = userRepository.findById(session.doctorId).orElse(null);
        if (doctor == null || doctor.getRole() != Role.DOCTOR) {
            return "Doctor not found. Please start the booking again.";
        }

        if (appointmentRepository.existsByDoctorAndAppointmentDateAndAppointmentTime(doctor, session.date, session.time)) {
            return "That slot was just booked by someone else. Please start again and choose another time.";
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(session.date);
        appointment.setAppointmentTime(session.time);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setReason(session.reason);
        appointmentRepository.save(appointment);

        return "Appointment booked successfully with Dr. "
                + cleanupDoctorName(doctor.getName())
                + " for " + session.reason
                + " on " + session.date.format(DISPLAY_DATE)
                + " at " + session.time.format(DISPLAY_TIME)
                + ". Status: PENDING";
    }

    private String buildDoctorSuggestionPrompt(BookingSession session) {
        List<DoctorProfile> doctors = session.suggestedDoctors;
        String specializationLabel = session.specialization == null ? "relevant" : session.specialization;

        if (doctors.isEmpty()) {
            doctors = doctorProfileRepository.findAll().stream()
                    .filter(profile -> profile.getUser() != null && profile.getUser().getRole() == Role.DOCTOR)
                    .sorted(Comparator.comparing(profile -> safeLower(profile.getUser().getName())))
                    .limit(5)
                    .toList();
            session.suggestedDoctors = doctors;

            if (doctors.isEmpty()) {
                return "I could not find any doctors right now. Please try again later.";
            }

            return "I noted the reason as '" + session.reason + "'. I could not map it to a specialization, "
                    + "so choose one of these available doctors by number or name:\n"
                    + formatDoctorList(doctors);
        }

        return "Reason noted: " + session.reason + ". Based on that, you may need "
                + specializationLabel + ". Choose a doctor by number or name:\n"
                + formatDoctorList(doctors);
    }

    private String formatDoctorList(List<DoctorProfile> doctors) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < doctors.size(); i++) {
            DoctorProfile doctor = doctors.get(i);
            String hospital = doctor.getHospital() == null ? "MedVault Care" : doctor.getHospital().getName();
            builder.append(i + 1)
                    .append(". Dr. ")
                    .append(cleanupDoctorName(doctor.getUser().getName()))
                    .append(" - ")
                    .append(defaultText(doctor.getSpecialization(), "General Medicine"))
                    .append(" - ")
                    .append(hospital)
                    .append("\n");
        }
        return builder.toString().trim();
    }

    private String buildTimePrompt(String doctorName, LocalDate date, List<LocalTime> slots) {
        String slotText = slots.stream()
                .map(slot -> slot.format(DISPLAY_TIME))
                .reduce((left, right) -> left + ", " + right)
                .orElse("");

        return "Available slots with Dr. " + cleanupDoctorName(doctorName)
                + " on " + date.format(DISPLAY_DATE)
                + ": " + slotText
                + ". Please choose a time.";
    }

    private DoctorProfile resolveDoctorSelection(String message, BookingSession session) {
        String trimmed = message == null ? "" : message.trim();
        if (trimmed.matches("\\d+")) {
            int index = Integer.parseInt(trimmed);
            if (index >= 1 && index <= session.suggestedDoctors.size()) {
                return session.suggestedDoctors.get(index - 1);
            }
        }

        String normalizedMessage = normalizeDoctorName(trimmed);
        if (normalizedMessage.isBlank()) {
            return null;
        }

        for (DoctorProfile profile : session.suggestedDoctors) {
            if (profile.getUser() == null || profile.getUser().getName() == null) {
                continue;
            }
            String candidate = normalizeDoctorName(profile.getUser().getName());
            if (candidate.equals(normalizedMessage)
                    || candidate.contains(normalizedMessage)
                    || normalizedMessage.contains(candidate)) {
                return profile;
            }
        }

        for (DoctorProfile profile : doctorProfileRepository.findAll()) {
            if (profile.getUser() == null || profile.getUser().getName() == null) {
                continue;
            }
            String candidate = normalizeDoctorName(profile.getUser().getName());
            if (candidate.equals(normalizedMessage)
                    || candidate.contains(normalizedMessage)
                    || normalizedMessage.contains(candidate)) {
                return profile;
            }
        }

        return null;
    }

    private List<DoctorProfile> findDoctorsForSpecialization(String specialization) {
        return doctorProfileRepository.findAll().stream()
                .filter(profile -> profile.getUser() != null && profile.getUser().getRole() == Role.DOCTOR)
                .filter(profile -> specialization == null
                        || specialization.equalsIgnoreCase(defaultText(profile.getSpecialization(), "")))
                .sorted(Comparator.comparing(profile -> safeLower(profile.getUser().getName())))
                .limit(5)
                .toList();
    }

    private List<LocalTime> getAvailableSlots(Long doctorId, LocalDate date) {
        User doctor = userRepository.findById(doctorId).orElse(null);
        if (doctor == null) {
            return List.of();
        }

        List<Appointment> bookedAppointments = appointmentRepository.findByDoctorAndAppointmentDate(doctor, date);
        List<LocalTime> bookedTimes = bookedAppointments.stream()
                .map(Appointment::getAppointmentTime)
                .toList();

        return CLINIC_SLOTS.stream()
                .filter(slot -> !bookedTimes.contains(slot))
                .toList();
    }

    private String mapReasonToSpecialization(String reason) {
        if (reason == null) {
            return null;
        }

        String normalizedReason = normalize(reason);
        Map<String, String> specializationByKeyword = new LinkedHashMap<>();
        specializationByKeyword.put("cardiology", "Cardiology");
        specializationByKeyword.put("chest pain", "Cardiology");
        specializationByKeyword.put("heart", "Cardiology");
        specializationByKeyword.put("bp", "Cardiology");
        specializationByKeyword.put("blood pressure", "Cardiology");
        specializationByKeyword.put("skin", "Dermatology");
        specializationByKeyword.put("rash", "Dermatology");
        specializationByKeyword.put("itching", "Dermatology");
        specializationByKeyword.put("acne", "Dermatology");
        specializationByKeyword.put("tooth", "Dentistry");
        specializationByKeyword.put("dental", "Dentistry");
        specializationByKeyword.put("gum", "Dentistry");
        specializationByKeyword.put("fever", "General Medicine");
        specializationByKeyword.put("cold", "General Medicine");
        specializationByKeyword.put("cough", "General Medicine");
        specializationByKeyword.put("infection", "General Medicine");
        specializationByKeyword.put("stomach", "Gastroenterology");
        specializationByKeyword.put("gastric", "Gastroenterology");
        specializationByKeyword.put("abdomen", "Gastroenterology");
        specializationByKeyword.put("child", "Pediatrics");
        specializationByKeyword.put("baby", "Pediatrics");
        specializationByKeyword.put("pregnancy", "Gynecology");
        specializationByKeyword.put("period", "Gynecology");
        specializationByKeyword.put("bone", "Orthopedics");
        specializationByKeyword.put("knee", "Orthopedics");
        specializationByKeyword.put("joint", "Orthopedics");
        specializationByKeyword.put("headache", "Neurology");
        specializationByKeyword.put("migraine", "Neurology");
        specializationByKeyword.put("sugar", "Endocrinology");
        specializationByKeyword.put("diabetes", "Endocrinology");
        specializationByKeyword.put("eye", "Ophthalmology");
        specializationByKeyword.put("vision", "Ophthalmology");

        for (Map.Entry<String, String> entry : specializationByKeyword.entrySet()) {
            if (normalizedReason.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        return null;
    }

    private String extractReason(String message) {
        if (message == null) {
            return null;
        }

        String cleaned = message.trim()
                .replaceAll("(?i)^i\\s+need\\s+(an\\s+)?appointment\\s+(for|because of)\\s+", "")
                .replaceAll("(?i)^book\\s+(an\\s+)?appointment\\s+(for|because of)?\\s*", "")
                .replaceAll("(?i)^schedule\\s+(an\\s+)?appointment\\s+(for|because of)?\\s*", "")
                .replaceAll("(?i)^reason\\s*(is|:)\\s*", "")
                .trim();

        if (cleaned.isBlank()) {
            return null;
        }

        return cleaned.length() > 180 ? cleaned.substring(0, 180) : cleaned;
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
    private LocalDate extractDate(String message) {
        String text = normalize(message);

        if (text.contains("today")) {
            return LocalDate.now();
        }
        if (text.contains("tomorrow")) {
            return LocalDate.now().plusDays(1);
        }

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

    private String normalizeDoctorName(String value) {
        if (value == null) {
            return "";
        }

        return value.toLowerCase(Locale.ROOT)
                .replace("dr.", "")
                .replace("dr", "")
                .replaceAll("[^a-z]", "")
                .trim();
    }

    private String cleanupDoctorName(String name) {
        if (name == null) {
            return "";
        }
        return name.replaceFirst("(?i)^\\s*dr\\.?\\s*", "").trim();
    }

    private String normalize(String input) {
        return input == null ? "" : input.toLowerCase(Locale.ROOT).trim();
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
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

    private static class BookingSession {
        private String reason;
        private String specialization;
        private List<DoctorProfile> suggestedDoctors = new ArrayList<>();
        private Long doctorId;
        private String doctorName;
        private LocalDate date;
        private LocalTime time;
    }
}
