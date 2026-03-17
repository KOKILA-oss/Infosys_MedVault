package com.example.demo.dto;

import java.util.ArrayList;
import java.util.List;

public class AppointmentAvailabilityResponse {

    private List<String> availableSlots = new ArrayList<>();
    private String unavailableReason;

    public List<String> getAvailableSlots() {
        return availableSlots;
    }

    public void setAvailableSlots(List<String> availableSlots) {
        this.availableSlots = availableSlots;
    }

    public String getUnavailableReason() {
        return unavailableReason;
    }

    public void setUnavailableReason(String unavailableReason) {
        this.unavailableReason = unavailableReason;
    }
}
