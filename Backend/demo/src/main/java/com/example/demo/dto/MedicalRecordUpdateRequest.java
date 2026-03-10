package com.example.demo.dto;

import com.example.demo.entity.MedicalRecordCategory;

public class MedicalRecordUpdateRequest {

    private String title;
    private String description;
    private MedicalRecordCategory category;

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

    public MedicalRecordCategory getCategory() {
        return category;
    }

    public void setCategory(MedicalRecordCategory category) {
        this.category = category;
    }
}
