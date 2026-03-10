package com.example.demo.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.demo.dto.AppointmentRequest;
import com.example.demo.dto.AppointmentResponse;
import com.example.demo.dto.AppointmentStatus;
import com.example.demo.dto.DoctorPatientRegistryResponse;
import com.example.demo.dto.RescheduleRequest;
import com.example.demo.entity.Appointment;
import com.example.demo.entity.PatientProfile;
import com.example.demo.entity.User;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.UserRepository;

@Service
public class AppointmentService {

        private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);

        private final AppointmentRepository appointmentRepository;
        private final UserRepository userRepository;
        private final NotificationService notificationService;

        public AppointmentService(AppointmentRepository appointmentRepository,
                                                          UserRepository userRepository,
                                                          NotificationService notificationService) {
                this.appointmentRepository = appointmentRepository;
                this.userRepository = userRepository;
                this.notificationService = notificationService;
        }

    private AppointmentResponse mapToResponse(Appointment appointment) {
    return new AppointmentResponse(appointment);
}


    public void bookAppointment(AppointmentRequest request, String patientEmail) {

        // 1️⃣ Get patient from JWT email
        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        // 2️⃣ Get doctor using doctorId
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // Optional safety check
        if (!doctor.getRole().name().equals("DOCTOR")) {
            throw new RuntimeException("Selected user is not a doctor");
        }

        // 3️⃣ Check if slot already booked
        boolean exists = appointmentRepository
                .existsByDoctorAndAppointmentDateAndAppointmentTime(
                        doctor,
                        request.getDate(),
                        request.getTime()
                );

        if (exists) {
            throw new RuntimeException("Slot already booked");
        }

        // 4️⃣ Save appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(request.getDate());
        appointment.setAppointmentTime(request.getTime());
        appointment.setReason(request.getReason());
        appointment.setStatus(AppointmentStatus.PENDING);

        appointmentRepository.save(appointment);

        // Create notifications for doctor and patient
        try {
            String doctorMsg = "New appointment request from " + patient.getName()
                    + " on " + appointment.getAppointmentDate() + " at " + appointment.getAppointmentTime();

            notificationService.createNotification(
                    doctor,
                    patient,
                    "APPOINTMENT_REQUEST",
                    doctorMsg,
                    appointment
            );

            String patientMsg = "Your appointment request with Dr. " + doctor.getName()
                    + " is created and pending approval.";

            notificationService.createNotification(
                    patient,
                    doctor,
                    "APPOINTMENT_CREATED",
                    patientMsg,
                    appointment
            );
                } catch (Exception e) {
                        // notification failure should not break booking flow; log full stack for debugging
                        logger.error("Failed to create notifications", e);
                }
    }


    public List<AppointmentResponse> getDoctorAppointments(String doctorEmail) {

    User doctor = userRepository.findByEmail(doctorEmail)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));

    if (!doctor.getRole().name().equals("DOCTOR")) {
        throw new RuntimeException("Unauthorized access");
    }

    return appointmentRepository.findByDoctorId(doctor.getId())
        .stream()
        .map(this::mapToResponse)
        .toList();
}

public List<AppointmentResponse> getCompletedAppointments(String patientEmail) {

    User patient = userRepository.findByEmail(patientEmail)
            .orElseThrow();

    return appointmentRepository
            .findByPatientAndStatus(patient, AppointmentStatus.COMPLETED)
            .stream()
            .map(AppointmentResponse::new)
            .toList();
}

public List<AppointmentResponse> getTodayAppointmentsForDoctor(String email) {

    LocalDate today = LocalDate.now();

    List<Appointment> appointments =
            appointmentRepository.findByDoctorEmailAndAppointmentDateAndStatus(
                    email,
                    today,
                    AppointmentStatus.APPROVED
            );

    return appointments.stream()
            .map(AppointmentResponse::new)
            .toList();
}

public List<String> getAvailableSlots(Long doctorId, LocalDate date) {

    User doctor = userRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));

    // Clinic fixed timings (you can later move this to DB)
    List<String> allSlots = List.of(
            "09:00", "10:30", "12:00", "15:00", "16:30"
    );

    List<Appointment> booked =
            appointmentRepository.findByDoctorAndAppointmentDate(doctor, date);

    List<String> bookedTimes = booked.stream()
            .map(a -> a.getAppointmentTime().toString())
            .toList();

    return allSlots.stream()
            .filter(slot -> !bookedTimes.contains(slot))
            .toList();
}

public void rescheduleAppointment(RescheduleRequest request,
                                  String doctorEmail) {

    Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

    // 🔐 Security check
    if (!appointment.getDoctor().getEmail().equals(doctorEmail)) {
        throw new RuntimeException("Unauthorized action");
    }

    // 🚫 Prevent rescheduling cancelled appointment
    if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
        throw new RuntimeException("Cannot reschedule cancelled appointment");
    }

    // 🔥 Prevent double booking (excluding current appointment)
    boolean exists = appointmentRepository
            .existsByDoctorAndAppointmentDateAndAppointmentTimeAndIdNot(
                    appointment.getDoctor(),
                    request.getDate(),
                    request.getTime(),
                    appointment.getId()
            );

    if (exists) {
        throw new RuntimeException("Selected slot already booked");
    }

    // ✅ Update date & time
    appointment.setAppointmentDate(request.getDate());
    appointment.setAppointmentTime(request.getTime());

    // Optional note
    if (request.getNote() != null && !request.getNote().isBlank()) {
        appointment.setReason(request.getNote());
    }

    // 🔥 Keep APPROVED
    appointment.setStatus(AppointmentStatus.APPROVED);

    appointmentRepository.save(appointment);
        // Notify patient about reschedule
        try {
                User patient = appointment.getPatient();
                User doctor = appointment.getDoctor();
                String pmsg = "Your appointment with Dr. " + doctor.getName()
                                + " has been rescheduled to " + appointment.getAppointmentDate()
                                + " at " + appointment.getAppointmentTime();

                notificationService.createNotification(
                                patient,
                                doctor,
                                "APPOINTMENT_RESCHEDULED",
                                pmsg,
                                appointment
                );
                // Notify doctor about the reschedule as well
                try {
                    String dmsg = "You rescheduled the appointment with " + patient.getName()
                                    + " to " + appointment.getAppointmentDate()
                                    + " at " + appointment.getAppointmentTime();

                    notificationService.createNotification(
                                    doctor,
                                    doctor,
                                    "APPOINTMENT_RESCHEDULED",
                                    dmsg,
                                    appointment
                    );
                } catch (Exception ex) {
                    logger.error("Failed to create reschedule notification for doctor", ex);
                }
        } catch (Exception e) {
                logger.error("Failed to create reschedule notification", e);
        }
}

public void updateAppointmentStatus(Long appointmentId,
                                    String status,
                                    String doctorEmail) {

    Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

    if (!appointment.getDoctor().getEmail().equals(doctorEmail)) {
        throw new RuntimeException("Unauthorized action");
    }

    appointment.setStatus(AppointmentStatus.valueOf(status));
    appointmentRepository.save(appointment);
        // Notify patient about status change (approved/cancelled/rejected)
        try {
                User patient = appointment.getPatient();
                User doctor = appointment.getDoctor();
                String statusUpper = appointment.getStatus().name();
                String msg = null;

                if (statusUpper.equals("CANCELLED")) {
                        msg = "Your appointment on " + appointment.getAppointmentDate() + " at " + appointment.getAppointmentTime() + " was cancelled by Dr. " + doctor.getName();
                        notificationService.createNotification(patient, doctor, "APPOINTMENT_CANCELLED", msg, appointment);
                } else if (statusUpper.equals("APPROVED")) {
                        msg = "Your appointment on " + appointment.getAppointmentDate() + " at " + appointment.getAppointmentTime() + " has been approved by Dr. " + doctor.getName();
                        notificationService.createNotification(patient, doctor, "APPOINTMENT_APPROVED", msg, appointment);
                } else if (statusUpper.equals("REJECTED")) {
                        msg = "Your appointment request on " + appointment.getAppointmentDate() + " at " + appointment.getAppointmentTime() + " was rejected by Dr. " + doctor.getName();
                        notificationService.createNotification(patient, doctor, "APPOINTMENT_REJECTED", msg, appointment);
                }
                                // Also notify the doctor about the action they performed
                                try {
                                        String dmsg = null;

                                        if (statusUpper.equals("CANCELLED")) {
                                                dmsg = "You cancelled the appointment on " + appointment.getAppointmentDate() + " at " + appointment.getAppointmentTime() + " for " + patient.getName();
                                        } else if (statusUpper.equals("APPROVED")) {
                                                dmsg = "You approved the appointment on " + appointment.getAppointmentDate() + " at " + appointment.getAppointmentTime() + " for " + patient.getName();
                                        } else if (statusUpper.equals("REJECTED")) {
                                                dmsg = "You rejected the appointment request on " + appointment.getAppointmentDate() + " at " + appointment.getAppointmentTime() + " for " + patient.getName();
                                        }

                                        if (dmsg != null) {
                                                notificationService.createNotification(doctor, doctor, "APPOINTMENT_STATUS_CHANGED", dmsg, appointment);
                                        }
                                } catch (Exception ex) {
                                        logger.error("Failed to create status-change notification for doctor", ex);
                                }
        } catch (Exception e) {
                logger.error("Failed to create status-change notification", e);
        }
}


public List<AppointmentResponse> getPatientAppointments(String patientEmail) {

    User patient = userRepository.findByEmail(patientEmail)
            .orElseThrow(() -> new RuntimeException("Patient not found"));

    if (!patient.getRole().name().equals("PATIENT")) {
        throw new RuntimeException("Unauthorized access");
    }

    return appointmentRepository.findByPatient(patient)
            .stream()
            .map(this::mapToResponse)
            .toList();
}

public List<DoctorPatientRegistryResponse> getDoctorPatientRegistry(String doctorEmail) {

    User doctor = userRepository.findByEmail(doctorEmail)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));

    if (!doctor.getRole().name().equals("DOCTOR")) {
        throw new RuntimeException("Unauthorized access");
    }

    List<Appointment> appointments = appointmentRepository.findByDoctor(doctor);

    Map<Long, List<Appointment>> appointmentsByPatient = appointments.stream()
            .filter(appointment -> appointment.getPatient() != null)
            .collect(Collectors.groupingBy(appointment -> appointment.getPatient().getId()));

    return appointmentsByPatient.values().stream()
            .map(this::mapToDoctorPatientRegistryResponse)
            .sorted((left, right) -> {
                String leftName = left.getName() == null ? "" : left.getName().toLowerCase();
                String rightName = right.getName() == null ? "" : right.getName().toLowerCase();
                return leftName.compareTo(rightName);
            })
            .toList();
}

private DoctorPatientRegistryResponse mapToDoctorPatientRegistryResponse(List<Appointment> patientAppointments) {
    Appointment latestAppointment = patientAppointments.stream()
            .sorted((left, right) -> {
                LocalDate leftDate = left.getAppointmentDate();
                LocalDate rightDate = right.getAppointmentDate();

                if (leftDate == null && rightDate == null) {
                    return 0;
                }
                if (leftDate == null) {
                    return 1;
                }
                if (rightDate == null) {
                    return -1;
                }

                int dateCompare = rightDate.compareTo(leftDate);
                if (dateCompare != 0) {
                    return dateCompare;
                }

                if (left.getAppointmentTime() == null && right.getAppointmentTime() == null) {
                    return 0;
                }
                if (left.getAppointmentTime() == null) {
                    return 1;
                }
                if (right.getAppointmentTime() == null) {
                    return -1;
                }

                return right.getAppointmentTime().compareTo(left.getAppointmentTime());
            })
            .findFirst()
            .orElseThrow(() -> new RuntimeException("No patient appointments found"));

    User patient = latestAppointment.getPatient();
    PatientProfile patientProfile = patient.getPatientProfile();

    DoctorPatientRegistryResponse response = new DoctorPatientRegistryResponse();
    response.setPatientId(patient.getId());
    response.setName(patient.getName());
    response.setEmail(patient.getEmail());
    response.setAppointmentCount(patientAppointments.size());
    response.setLatestAppointmentDate(latestAppointment.getAppointmentDate());
    response.setLatestAppointmentStatus(
            latestAppointment.getStatus() == null ? null : latestAppointment.getStatus().name()
    );

    if (patientProfile != null) {
        response.setPhoneNumber(patientProfile.getPhoneNumber());
        response.setGender(patientProfile.getGender());
        response.setBloodGroup(patientProfile.getBloodGroup());
        response.setHeight(patientProfile.getHeight());
        response.setWeight(patientProfile.getWeight());
        response.setSugarLevel(patientProfile.getSugarLevel());
        response.setAddress(patientProfile.getAddress());
        response.setAllergies(patientProfile.getAllergies());
        response.setEmergencyContact(patientProfile.getEmergencyContact());
    }

    return response;
}

}

