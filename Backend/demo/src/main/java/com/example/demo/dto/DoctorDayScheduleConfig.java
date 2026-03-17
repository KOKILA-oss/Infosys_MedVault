package com.example.demo.dto;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class DoctorDayScheduleConfig {

    private boolean offDay;
    private String offReason;
    private List<DoctorScheduleSlot> slots = new ArrayList<>();

    @JsonProperty("isOffDay")
    @JsonAlias({"isOffDay", "offDay"})
    public boolean isOffDay() {
        return offDay;
    }

    @JsonProperty("isOffDay")
    @JsonAlias({"isOffDay", "offDay"})
    public void setOffDay(boolean offDay) {
        this.offDay = offDay;
    }

    public String getOffReason() {
        return offReason;
    }

    public void setOffReason(String offReason) {
        this.offReason = offReason;
    }

    public List<DoctorScheduleSlot> getSlots() {
        return slots;
    }

    public void setSlots(List<DoctorScheduleSlot> slots) {
        this.slots = slots;
    }
}
