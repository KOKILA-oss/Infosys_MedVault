package com.example.demo.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.demo.entity.Appointment;
import com.example.demo.entity.User;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;

@Service
public class ChatService {

    @Value("${openrouter.api.key}")
    private String apiKey;

    private static final String URL = "https://openrouter.ai/api/v1/chat/completions";

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;


    private RestTemplate restTemplate = new RestTemplate();

    public String getChatResponse(String userMessage, String token) {

        try {

            String email = jwtUtil.extractEmail(token);
            User patient = userRepository.findByEmail(email).orElse(null);

            if (patient == null) {
                return "User not found.";
            }

            // STEP 1: Detect booking intent
            if (userMessage.toLowerCase().contains("book")) {
                return "Sure. Please provide doctor name, date and time.";
            }

            // STEP 2: Detect doctor selection
            if (userMessage.toLowerCase().contains("kritii")) {

                return bookAppointment(patient, "kritii",
                        LocalDate.of(2026, 3, 21),
                        LocalTime.of(10, 0));
            }

            // STEP 3: If user asks for appointments
            if (userMessage.toLowerCase().contains("appointment")) {
                return getAppointments(patient);
            }

            // STEP 4: Otherwise ask AI
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
                        .findByPatientAndAppointmentDateGreaterThanEqual(
                                patient,
                                LocalDate.now());

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

    private String bookAppointment(User patient,
                               String doctorName,
                               LocalDate date,
                               LocalTime time) {

    // Find doctor user
    User doctor = userRepository.findByNameIgnoreCase(doctorName);

    if (doctor == null) {
        return "Doctor not found.";
    }

    Appointment appointment = new Appointment();

    appointment.setPatient(patient);
    appointment.setDoctor(doctor);   // ✅ correct
    appointment.setAppointmentDate(date);
    appointment.setAppointmentTime(time);

    appointmentRepository.save(appointment);

    return "✅ Appointment booked successfully with Dr. "
            + doctor.getName()
            + " on "
            + date
            + " at "
            + time;
}
}