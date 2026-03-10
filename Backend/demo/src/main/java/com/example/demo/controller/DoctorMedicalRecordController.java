package com.example.demo.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.MedicalRecordResponse;
import com.example.demo.entity.MedicalRecord;
import com.example.demo.entity.MedicalRecordCategory;
import com.example.demo.service.MedicalRecordService;

@RestController
@RequestMapping("/api/doctor/records")
public class DoctorMedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public DoctorMedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecordResponse>> patientRecords(Principal principal,
                                                                      @PathVariable Long patientId,
                                                                      @RequestParam(value = "category", required = false)
                                                                      MedicalRecordCategory category) {
        return ResponseEntity.ok(
                medicalRecordService.getRecordsForDoctor(principal.getName(), patientId, category)
        );
    }

    @GetMapping("/{recordId}/download")
    public ResponseEntity<byte[]> downloadRecord(Principal principal, @PathVariable Long recordId) {
        MedicalRecord record = medicalRecordService.getRecordFileForDoctor(principal.getName(), recordId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(record.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + record.getFileName() + "\"")
                .body(record.getFileData());
    }
}
