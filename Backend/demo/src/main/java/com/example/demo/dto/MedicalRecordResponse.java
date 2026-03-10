package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.entity.MedicalRecord;
import com.example.demo.entity.MedicalRecordCategory;

public class MedicalRecordResponse {

    private Long id;
    private MedicalRecordCategory category;
    private String title;
    private String description;
    private String fileName;
    private String contentType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MedicalRecordResponse() {
    }

    public MedicalRecordResponse(MedicalRecord record) {
        this.id = record.getId();
        this.category = record.getCategory();
        this.title = record.getTitle();
        this.description = record.getDescription();
        this.fileName = record.getFileName();
        this.contentType = record.getContentType();
        this.createdAt = record.getCreatedAt();
        this.updatedAt = record.getUpdatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MedicalRecordCategory getCategory() {
        return category;
    }

    public void setCategory(MedicalRecordCategory category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
