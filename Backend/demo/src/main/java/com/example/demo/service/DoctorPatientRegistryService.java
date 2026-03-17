package com.example.demo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.AppointmentResponse;
import com.example.demo.dto.AppointmentStatus;
import com.example.demo.dto.DoctorPatientRegistryResponse;
import com.example.demo.dto.DoctorPatientVisitEntryRequest;
import com.example.demo.dto.DoctorPatientVisitEntryResponse;
import com.example.demo.dto.RegistryCheckupItem;
import com.example.demo.dto.RegistryPrescriptionItem;
import com.example.demo.dto.RegistryTipItem;
import com.example.demo.entity.Appointment;
import com.example.demo.entity.DoctorPatientVisitEntry;
import com.example.demo.entity.PatientProfile;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.DoctorPatientVisitEntryRepository;
import com.example.demo.repository.UserRepository;

@Service
public class DoctorPatientRegistryService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorPatientVisitEntryRepository visitEntryRepository;
    private final UserRepository userRepository;

    public DoctorPatientRegistryService(AppointmentRepository appointmentRepository,
                                        DoctorPatientVisitEntryRepository visitEntryRepository,
                                        UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.visitEntryRepository = visitEntryRepository;
        this.userRepository = userRepository;
    }

    public List<DoctorPatientRegistryResponse> getDoctorPatientRegistry(String doctorEmail) {
        User doctor = getDoctorByEmail(doctorEmail);
        LocalDateTime now = LocalDateTime.now();

        Map<Long, List<Appointment>> appointmentsByPatient = appointmentRepository.findByDoctor(doctor).stream()
                .filter(appointment -> appointment.getPatient() != null)
                .collect(Collectors.groupingBy(appointment -> appointment.getPatient().getId()));

        return appointmentsByPatient.values().stream()
                .filter(appointments -> hasCompletedHistory(appointments, now))
                .map(appointments -> mapPatientRegistry(doctor, appointments))
                .sorted(Comparator.comparing(item -> item.getName() == null ? "" : item.getName().toLowerCase()))
                .toList();
    }

    public List<DoctorPatientVisitEntryResponse> getPatientRegistryEntries(String patientEmail) {
        User patient = getPatientByEmail(patientEmail);
        return visitEntryRepository.findByPatientOrderByCreatedAtDesc(patient).stream()
                .map(this::mapVisitEntry)
                .toList();
    }

    @Transactional
    public DoctorPatientVisitEntryResponse saveVisitEntry(Long patientId,
                                                          DoctorPatientVisitEntryRequest request,
                                                          String doctorEmail) {
        User doctor = getDoctorByEmail(doctorEmail);
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        if (patient.getRole() != Role.PATIENT) {
            throw new RuntimeException("Selected user is not a patient");
        }

        List<Appointment> appointments = appointmentRepository.findByDoctor(doctor).stream()
                .filter(item -> item.getPatient() != null && item.getPatient().getId().equals(patientId))
                .toList();

        if (appointments.isEmpty()) {
            throw new RuntimeException("No appointments found for this patient");
        }

        Appointment matchedAppointment = resolveVisitAppointment(appointments, request.getAppointmentId());
        if (matchedAppointment == null) {
            throw new RuntimeException("No completed appointment found for this patient");
        }

        DoctorPatientVisitEntry entry = new DoctorPatientVisitEntry();
        entry.setDoctor(doctor);
        entry.setPatient(patient);
        entry.setAppointment(matchedAppointment);
        entry.setDiagnosis(trimToNull(request.getDiagnosis()));
        entry.setSymptoms(trimToNull(request.getSymptoms()));
        entry.setVitals(trimToNull(request.getVitals()));
        entry.setFollowUpDate(request.getFollowUpDate());
        entry.setDoctorNotes(trimToNull(request.getDoctorNotes()));
        entry.setPrescriptionsJson(serializePrescriptions(normalizePrescriptions(request.getPrescriptions())));
        entry.setCheckupsJson(serializeCheckups(normalizeCheckups(request.getCheckups())));
        entry.setTipsJson(serializeTips(normalizeTips(request.getTips())));
        entry.setCreatedAt(LocalDateTime.now());
        entry.setUpdatedAt(LocalDateTime.now());

        return mapVisitEntry(visitEntryRepository.save(entry));
    }

    private DoctorPatientRegistryResponse mapPatientRegistry(User doctor, List<Appointment> patientAppointments) {
        List<Appointment> sortedAppointments = patientAppointments.stream()
                .sorted(Comparator.comparing(this::toDateTimeSafe))
                .toList();

        Appointment latestAppointment = sortedAppointments.get(sortedAppointments.size() - 1);
        User patient = latestAppointment.getPatient();
        PatientProfile patientProfile = patient.getPatientProfile();

        DoctorPatientRegistryResponse response = new DoctorPatientRegistryResponse();
        response.setPatientId(patient.getId());
        response.setName(patient.getName());
        response.setEmail(patient.getEmail());
        response.setAppointmentCount(sortedAppointments.size());
        response.setLatestAppointmentDate(latestAppointment.getAppointmentDate());
        response.setLatestAppointmentStatus(
                latestAppointment.getStatus() == null ? null : latestAppointment.getStatus().name()
        );
        response.setAppointments(sortedAppointments.stream().map(AppointmentResponse::new).toList());
        response.setVisitEntries(
                visitEntryRepository.findByDoctorAndPatientOrderByCreatedAtDesc(doctor, patient).stream()
                        .map(this::mapVisitEntry)
                        .toList()
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

    private DoctorPatientVisitEntryResponse mapVisitEntry(DoctorPatientVisitEntry entry) {
        DoctorPatientVisitEntryResponse response = new DoctorPatientVisitEntryResponse();
        response.setId(entry.getId());
        response.setDoctorName(entry.getDoctor() == null ? null : entry.getDoctor().getName());
        response.setDiagnosis(entry.getDiagnosis());
        response.setSymptoms(entry.getSymptoms());
        response.setVitals(entry.getVitals());
        response.setFollowUpDate(entry.getFollowUpDate());
        response.setDoctorNotes(entry.getDoctorNotes());
        response.setPrescriptions(deserializePrescriptions(entry.getPrescriptionsJson()));
        response.setCheckups(deserializeCheckups(entry.getCheckupsJson()));
        response.setTips(deserializeTips(entry.getTipsJson()));
        response.setCreatedAt(entry.getCreatedAt());

        if (entry.getAppointment() != null) {
            response.setAppointmentId(entry.getAppointment().getId());
            response.setAppointmentDate(entry.getAppointment().getAppointmentDate());
            response.setAppointmentTime(entry.getAppointment().getAppointmentTime());
        }

        return response;
    }

    private boolean hasCompletedHistory(List<Appointment> appointments, LocalDateTime now) {
        return appointments.stream().anyMatch(appointment -> isCompletedOrPast(appointment, now));
    }

    private boolean isCompletedOrPast(Appointment appointment, LocalDateTime now) {
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            return true;
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            return false;
        }
        LocalDateTime appointmentDateTime = toDateTimeOrNull(appointment);
        return appointmentDateTime != null && !appointmentDateTime.isAfter(now);
    }

    private Appointment resolveVisitAppointment(List<Appointment> appointments, Long appointmentId) {
        LocalDateTime now = LocalDateTime.now();

        if (appointmentId != null) {
            return appointments.stream()
                    .filter(item -> item.getId().equals(appointmentId))
                    .filter(item -> isCompletedOrPast(item, now))
                    .findFirst()
                    .orElse(null);
        }

        return appointments.stream()
                .filter(item -> isCompletedOrPast(item, now))
                .max(Comparator.comparing(this::toDateTimeSafe))
                .orElse(null);
    }

    private LocalDateTime toDateTimeOrNull(Appointment appointment) {
        LocalDate date = appointment.getAppointmentDate();
        LocalTime time = appointment.getAppointmentTime() == null ? LocalTime.MIDNIGHT : appointment.getAppointmentTime();
        if (date == null) return null;
        return LocalDateTime.of(date, time);
    }

    private LocalDateTime toDateTimeSafe(Appointment appointment) {
        LocalDateTime value = toDateTimeOrNull(appointment);
        return value == null ? LocalDateTime.MIN : value;
    }

    private List<RegistryPrescriptionItem> normalizePrescriptions(List<RegistryPrescriptionItem> items) {
        if (items == null) return List.of();
        List<RegistryPrescriptionItem> normalized = new ArrayList<>();
        for (RegistryPrescriptionItem item : items) {
            if (item == null || trimToNull(item.getMedication()) == null) continue;
            RegistryPrescriptionItem next = new RegistryPrescriptionItem();
            next.setId(item.getId() == null ? System.currentTimeMillis() + normalized.size() : item.getId());
            next.setMedication(trimToNull(item.getMedication()));
            next.setDosage(trimToNull(item.getDosage()));
            next.setDuration(trimToNull(item.getDuration()));
            next.setInstructions(trimToNull(item.getInstructions()));
            next.setDateIssued(item.getDateIssued() == null ? LocalDateTime.now() : item.getDateIssued());
            normalized.add(next);
        }
        return normalized;
    }

    private List<RegistryCheckupItem> normalizeCheckups(List<RegistryCheckupItem> items) {
        if (items == null) return List.of();
        List<RegistryCheckupItem> normalized = new ArrayList<>();
        for (RegistryCheckupItem item : items) {
            if (item == null) continue;
            if (trimToNull(item.getBp()) == null
                    && trimToNull(item.getHeartRate()) == null
                    && trimToNull(item.getSugarLevel()) == null
                    && trimToNull(item.getWeight()) == null) {
                continue;
            }
            RegistryCheckupItem next = new RegistryCheckupItem();
            next.setId(item.getId() == null ? System.currentTimeMillis() + normalized.size() : item.getId());
            next.setBp(trimToNull(item.getBp()));
            next.setHeartRate(trimToNull(item.getHeartRate()));
            next.setSugarLevel(trimToNull(item.getSugarLevel()));
            next.setWeight(trimToNull(item.getWeight()));
            next.setMeasuredAt(item.getMeasuredAt() == null ? LocalDateTime.now() : item.getMeasuredAt());
            normalized.add(next);
        }
        return normalized;
    }

    private List<RegistryTipItem> normalizeTips(List<RegistryTipItem> items) {
        if (items == null) return List.of();
        List<RegistryTipItem> normalized = new ArrayList<>();
        for (RegistryTipItem item : items) {
            if (item == null || trimToNull(item.getText()) == null) continue;
            RegistryTipItem next = new RegistryTipItem();
            next.setId(item.getId() == null ? System.currentTimeMillis() + normalized.size() : item.getId());
            next.setText(trimToNull(item.getText()));
            next.setAddedAt(item.getAddedAt() == null ? LocalDateTime.now() : item.getAddedAt());
            normalized.add(next);
        }
        return normalized;
    }

    private String serializePrescriptions(List<RegistryPrescriptionItem> items) {
        return items.stream()
                .map(item -> joinFields(
                        String.valueOf(item.getId()),
                        item.getMedication(),
                        item.getDosage(),
                        item.getDuration(),
                        item.getInstructions(),
                        item.getDateIssued() == null ? "" : item.getDateIssued().toString()
                ))
                .collect(Collectors.joining("\n"));
    }

    private List<RegistryPrescriptionItem> deserializePrescriptions(String value) {
        if (value == null || value.isBlank()) return List.of();
        return value.lines()
                .map(line -> splitFields(line, 6))
                .map(parts -> {
                    RegistryPrescriptionItem item = new RegistryPrescriptionItem();
                    item.setId(parseLong(parts[0]));
                    item.setMedication(emptyToNull(parts[1]));
                    item.setDosage(emptyToNull(parts[2]));
                    item.setDuration(emptyToNull(parts[3]));
                    item.setInstructions(emptyToNull(parts[4]));
                    item.setDateIssued(parseDateTime(parts[5]));
                    return item;
                })
                .toList();
    }

    private String serializeCheckups(List<RegistryCheckupItem> items) {
        return items.stream()
                .map(item -> joinFields(
                        String.valueOf(item.getId()),
                        item.getBp(),
                        item.getHeartRate(),
                        item.getSugarLevel(),
                        item.getWeight(),
                        item.getMeasuredAt() == null ? "" : item.getMeasuredAt().toString()
                ))
                .collect(Collectors.joining("\n"));
    }

    private List<RegistryCheckupItem> deserializeCheckups(String value) {
        if (value == null || value.isBlank()) return List.of();
        return value.lines()
                .map(line -> splitFields(line, 6))
                .map(parts -> {
                    RegistryCheckupItem item = new RegistryCheckupItem();
                    item.setId(parseLong(parts[0]));
                    item.setBp(emptyToNull(parts[1]));
                    item.setHeartRate(emptyToNull(parts[2]));
                    item.setSugarLevel(emptyToNull(parts[3]));
                    item.setWeight(emptyToNull(parts[4]));
                    item.setMeasuredAt(parseDateTime(parts[5]));
                    return item;
                })
                .toList();
    }

    private String serializeTips(List<RegistryTipItem> items) {
        return items.stream()
                .map(item -> joinFields(
                        String.valueOf(item.getId()),
                        item.getText(),
                        item.getAddedAt() == null ? "" : item.getAddedAt().toString()
                ))
                .collect(Collectors.joining("\n"));
    }

    private List<RegistryTipItem> deserializeTips(String value) {
        if (value == null || value.isBlank()) return List.of();
        return value.lines()
                .map(line -> splitFields(line, 3))
                .map(parts -> {
                    RegistryTipItem item = new RegistryTipItem();
                    item.setId(parseLong(parts[0]));
                    item.setText(emptyToNull(parts[1]));
                    item.setAddedAt(parseDateTime(parts[2]));
                    return item;
                })
                .toList();
    }

    private User getDoctorByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (user.getRole() != Role.DOCTOR) {
            throw new RuntimeException("Unauthorized access");
        }
        return user;
    }

    private User getPatientByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        if (user.getRole() != Role.PATIENT) {
            throw new RuntimeException("Unauthorized access");
        }
        return user;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String joinFields(String... fields) {
        return java.util.Arrays.stream(fields)
                .map(value -> value == null ? "" : value.replace("\\", "\\\\").replace("|", "\\p").replace("\n", "\\n"))
                .collect(Collectors.joining("|"));
    }

    private String[] splitFields(String encoded, int size) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean escaping = false;

        for (int index = 0; index < encoded.length(); index += 1) {
            char value = encoded.charAt(index);
            if (escaping) {
                if (value == 'p') current.append('|');
                else if (value == 'n') current.append('\n');
                else current.append(value);
                escaping = false;
            } else if (value == '\\') {
                escaping = true;
            } else if (value == '|') {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(value);
            }
        }

        values.add(current.toString());
        while (values.size() < size) {
          values.add("");
        }
        return values.toArray(new String[0]);
    }

    private Long parseLong(String value) {
        try {
            return value == null || value.isBlank() ? null : Long.valueOf(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private LocalDateTime parseDateTime(String value) {
        try {
            return value == null || value.isBlank() ? null : LocalDateTime.parse(value);
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
