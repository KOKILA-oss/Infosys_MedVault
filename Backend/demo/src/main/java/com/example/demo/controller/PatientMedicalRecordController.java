package com.example.demo.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.ConsentRequest;
import com.example.demo.dto.ConsentResponse;
import com.example.demo.dto.MedicalRecordResponse;
import com.example.demo.dto.MedicalRecordUpdateRequest;
import com.example.demo.entity.MedicalRecord;
import com.example.demo.entity.MedicalRecordAuditLog;
import com.example.demo.entity.MedicalRecordCategory;
import com.example.demo.service.MedicalRecordService;

@RestController
@RequestMapping("/api/patient/records")
public class PatientMedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public PatientMedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @PostMapping("/upload")
    public ResponseEntity<MedicalRecordResponse> uploadRecord(Principal principal,
                                                              @RequestParam("file") MultipartFile file,
                                                              @RequestParam("title") String title,
                                                              @RequestParam(value = "description", required = false) String description,
                                                              @RequestParam("category") MedicalRecordCategory category,
                                                              @RequestParam(value = "sharedDoctorId", required = false) Long sharedDoctorId,
                                                              @RequestParam(value = "appointmentId", required = false) Long appointmentId) {
        return ResponseEntity.ok(
                medicalRecordService.uploadRecord(principal.getName(), file, title, description, category, sharedDoctorId, appointmentId)
        );
    }

    @GetMapping
    public ResponseEntity<List<MedicalRecordResponse>> myRecords(Principal principal,
                                                                 @RequestParam(value = "category", required = false)
                                                                 MedicalRecordCategory category) {
        return ResponseEntity.ok(medicalRecordService.getMyRecords(principal.getName(), category));
    }

    @PutMapping("/{recordId}")
    public ResponseEntity<MedicalRecordResponse> updateRecord(Principal principal,
                                                              @PathVariable Long recordId,
                                                              @RequestBody MedicalRecordUpdateRequest request) {
        return ResponseEntity.ok(medicalRecordService.updateRecord(principal.getName(), recordId, request));
    }

    @DeleteMapping("/{recordId}")
    public ResponseEntity<String> deleteRecord(Principal principal, @PathVariable Long recordId) {
        medicalRecordService.deleteRecord(principal.getName(), recordId);
        return ResponseEntity.ok("Record deleted successfully");
    }

    @GetMapping("/{recordId}/download")
    public ResponseEntity<byte[]> downloadOwnRecord(Principal principal, @PathVariable Long recordId) {
        MedicalRecord record = medicalRecordService.getOwnedRecordFile(principal.getName(), recordId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(record.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + record.getFileName() + "\"")
                .body(record.getFileData());
    }

    @PostMapping("/consents")
    public ResponseEntity<ConsentResponse> grantConsent(Principal principal,
                                                        @RequestBody ConsentRequest request) {
        return ResponseEntity.ok(
                new ConsentResponse(medicalRecordService.grantConsent(principal.getName(), request))
        );
    }

    @GetMapping("/consents")
    public ResponseEntity<List<ConsentResponse>> myConsents(Principal principal) {
        return ResponseEntity.ok(
                medicalRecordService.getMyConsents(principal.getName())
                        .stream()
                        .map(ConsentResponse::new)
                        .toList()
        );
    }

    @DeleteMapping("/consents/{consentId}")
    public ResponseEntity<String> revokeConsent(Principal principal, @PathVariable Long consentId) {
        medicalRecordService.revokeConsent(principal.getName(), consentId);
        return ResponseEntity.ok("Consent revoked");
    }

    @GetMapping("/{recordId}/audit")
    public ResponseEntity<List<MedicalRecordAuditLog>> getRecordAudit(Principal principal,
                                                                      @PathVariable Long recordId) {
        return ResponseEntity.ok(medicalRecordService.getRecordAudit(principal.getName(), recordId));
    }
}
