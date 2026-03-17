package com.example.demo.dto;

public class PatientTipResponse {

    private final String title;
    private final String description;
    private final String matchedReason;

    public PatientTipResponse(String title, String description, String matchedReason) {
        this.title = title;
        this.description = description;
        this.matchedReason = matchedReason;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getMatchedReason() {
        return matchedReason;
    }
}
