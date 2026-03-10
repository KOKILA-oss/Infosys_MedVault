package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.ConsentRequest;
import com.example.demo.dto.MedicalRecordResponse;
import com.example.demo.dto.MedicalRecordUpdateRequest;
import com.example.demo.entity.MedicalRecord;
import com.example.demo.entity.MedicalRecordAuditLog;
import com.example.demo.entity.MedicalRecordCategory;
import com.example.demo.entity.MedicalRecordConsent;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.MedicalRecordAuditLogRepository;
import com.example.demo.repository.MedicalRecordConsentRepository;
import com.example.demo.repository.MedicalRecordRepository;
import com.example.demo.repository.UserRepository;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalRecordConsentRepository consentRepository;
    private final MedicalRecordAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository,
                                MedicalRecordConsentRepository consentRepository,
                                MedicalRecordAuditLogRepository auditLogRepository,
                                UserRepository userRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.consentRepository = consentRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public MedicalRecordResponse uploadRecord(String patientEmail,
                                              MultipartFile file,
                                              String title,
                                              String description,
                                              MedicalRecordCategory category) {
        User patient = getPatientByEmail(patientEmail);
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }
        if (category == null) {
            throw new RuntimeException("Category is required");
        }
        if (title == null || title.isBlank()) {
            throw new RuntimeException("Title is required");
        }

        MedicalRecord record = new MedicalRecord();
        record.setOwner(patient);
        record.setCategory(category);
        record.setTitle(title.trim());
        record.setDescription(description);
        record.setFileName(file.getOriginalFilename() == null ? "record" : file.getOriginalFilename());
        record.setContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
        record.setCreatedAt(LocalDateTime.now());
        record.setDeleted(false);

        try {
            record.setFileData(file.getBytes());
        } catch (Exception e) {
            throw new RuntimeException("Failed to read uploaded file");
        }

        MedicalRecord saved = medicalRecordRepository.save(record);
        logAudit(saved.getId(), "UPLOAD", patient.getEmail(), patient.getRole().name(),
                "Uploaded record with category " + category.name());
        return new MedicalRecordResponse(saved);
    }

    public List<MedicalRecordResponse> getMyRecords(String patientEmail, MedicalRecordCategory category) {
        User patient = getPatientByEmail(patientEmail);
        List<MedicalRecord> records;
        if (category == null) {
            records = medicalRecordRepository.findByOwnerAndDeletedFalseOrderByCreatedAtDesc(patient);
        } else {
            records = medicalRecordRepository.findByOwnerAndCategoryAndDeletedFalseOrderByCreatedAtDesc(patient, category);
        }
        return records.stream().map(MedicalRecordResponse::new).toList();
    }

    @Transactional
    public MedicalRecordResponse updateRecord(String patientEmail, Long recordId, MedicalRecordUpdateRequest request) {
        User patient = getPatientByEmail(patientEmail);
        MedicalRecord record = getOwnedActiveRecord(recordId, patient);

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            record.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            record.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            record.setCategory(request.getCategory());
        }
        record.setUpdatedAt(LocalDateTime.now());

        MedicalRecord saved = medicalRecordRepository.save(record);
        logAudit(saved.getId(), "UPDATE", patient.getEmail(), patient.getRole().name(), "Updated metadata");
        return new MedicalRecordResponse(saved);
    }

    @Transactional
    public void deleteRecord(String patientEmail, Long recordId) {
        User patient = getPatientByEmail(patientEmail);
        MedicalRecord record = getOwnedActiveRecord(recordId, patient);
        record.setDeleted(true);
        record.setDeletedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        medicalRecordRepository.save(record);
        logAudit(record.getId(), "DELETE", patient.getEmail(), patient.getRole().name(), "Soft delete");
    }

    public MedicalRecord getOwnedRecordFile(String patientEmail, Long recordId) {
        User patient = getPatientByEmail(patientEmail);
        return getOwnedActiveRecord(recordId, patient);
    }

    @Transactional
    public MedicalRecordConsent grantConsent(String patientEmail, ConsentRequest request) {
        User patient = getPatientByEmail(patientEmail);
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException("Selected user is not a doctor");
        }

        MedicalRecordConsent consent = new MedicalRecordConsent();
        consent.setPatient(patient);
        consent.setDoctor(doctor);
        consent.setCategory(request.getCategory());
        consent.setGrantedAt(LocalDateTime.now());
        consent.setActive(true);
        consent.setExpiresAt(request.getExpiresAt());

        return consentRepository.save(consent);
    }

    public List<MedicalRecordConsent> getMyConsents(String patientEmail) {
        User patient = getPatientByEmail(patientEmail);
        return consentRepository.findByPatientAndActiveTrue(patient);
    }

    @Transactional
    public void revokeConsent(String patientEmail, Long consentId) {
        User patient = getPatientByEmail(patientEmail);
        MedicalRecordConsent consent = consentRepository.findById(consentId)
                .orElseThrow(() -> new RuntimeException("Consent not found"));
        if (!consent.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        consent.setActive(false);
        consent.setRevokedAt(LocalDateTime.now());
        consentRepository.save(consent);
    }

    public List<MedicalRecordResponse> getRecordsForDoctor(String doctorEmail,
                                                           Long patientId,
                                                           MedicalRecordCategory category) {
        User doctor = getDoctorByEmail(doctorEmail);
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        if (patient.getRole() != Role.PATIENT) {
            throw new RuntimeException("Selected user is not a patient");
        }

        List<MedicalRecordConsent> consents = getValidConsents(patient, doctor);
        if (consents.isEmpty()) {
            throw new RuntimeException("No active consent available");
        }

        Set<MedicalRecordCategory> allowedCategories = new HashSet<>();
        boolean fullAccess = false;
        for (MedicalRecordConsent consent : consents) {
            if (consent.getCategory() == null) {
                fullAccess = true;
                break;
            }
            allowedCategories.add(consent.getCategory());
        }

        List<MedicalRecord> records;
        if (category == null) {
            records = medicalRecordRepository.findByOwnerAndDeletedFalseOrderByCreatedAtDesc(patient);
        } else {
            records = medicalRecordRepository.findByOwnerAndCategoryAndDeletedFalseOrderByCreatedAtDesc(patient, category);
        }

        List<MedicalRecord> filtered = fullAccess ? records
                : records.stream().filter(r -> allowedCategories.contains(r.getCategory())).toList();

        for (MedicalRecord record : filtered) {
            logAudit(record.getId(), "DOCTOR_VIEW_LIST", doctor.getEmail(), doctor.getRole().name(),
                    "Viewed record metadata for patient " + patient.getId());
        }

        return filtered.stream().map(MedicalRecordResponse::new).toList();
    }

    public MedicalRecord getRecordFileForDoctor(String doctorEmail, Long recordId) {
        User doctor = getDoctorByEmail(doctorEmail);
        MedicalRecord record = medicalRecordRepository.findByIdAndDeletedFalse(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));

        List<MedicalRecordConsent> consents = getValidConsents(record.getOwner(), doctor);
        boolean allowed = false;
        for (MedicalRecordConsent consent : consents) {
            if (consent.getCategory() == null || consent.getCategory() == record.getCategory()) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            throw new RuntimeException("No active consent for this record");
        }

        logAudit(record.getId(), "DOCTOR_DOWNLOAD", doctor.getEmail(), doctor.getRole().name(), "Downloaded record");
        return record;
    }

    public List<MedicalRecordAuditLog> getRecordAudit(String patientEmail, Long recordId) {
        User patient = getPatientByEmail(patientEmail);
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));
        if (!record.getOwner().getId().equals(patient.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        return auditLogRepository.findByMedicalRecordIdOrderByCreatedAtDesc(recordId);
    }

    private User getPatientByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.PATIENT) {
            throw new RuntimeException("User is not a patient");
        }
        return user;
    }

    private User getDoctorByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.DOCTOR) {
            throw new RuntimeException("User is not a doctor");
        }
        return user;
    }

    private MedicalRecord getOwnedActiveRecord(Long recordId, User patient) {
        MedicalRecord record = medicalRecordRepository.findByIdAndDeletedFalse(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));
        if (!record.getOwner().getId().equals(patient.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        return record;
    }

    private List<MedicalRecordConsent> getValidConsents(User patient, User doctor) {
        LocalDateTime now = LocalDateTime.now();
        return consentRepository.findByPatientAndDoctorAndActiveTrue(patient, doctor)
                .stream()
                .filter(c -> c.getExpiresAt() == null || !c.getExpiresAt().isBefore(now))
                .toList();
    }

    private void logAudit(Long recordId,
                          String action,
                          String actorEmail,
                          String actorRole,
                          String details) {
        MedicalRecordAuditLog log = new MedicalRecordAuditLog();
        log.setMedicalRecordId(recordId);
        log.setAction(action);
        log.setActorEmail(actorEmail);
        log.setActorRole(actorRole);
        log.setDetails(details);
        log.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(log);
    }
}
