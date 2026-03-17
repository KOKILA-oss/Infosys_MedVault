package com.example.demo.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DoctorScheduleConfigRequest {

    private List<DoctorScheduleSlot> defaultSlots = new ArrayList<>();
    private List<Integer> defaultActiveDays = new ArrayList<>();
    private Map<String, DoctorDayScheduleConfig> dayConfigs = new HashMap<>();

    public List<DoctorScheduleSlot> getDefaultSlots() {
        return defaultSlots;
    }

    public void setDefaultSlots(List<DoctorScheduleSlot> defaultSlots) {
        this.defaultSlots = defaultSlots;
    }

    public List<Integer> getDefaultActiveDays() {
        return defaultActiveDays;
    }

    public void setDefaultActiveDays(List<Integer> defaultActiveDays) {
        this.defaultActiveDays = defaultActiveDays;
    }

    public Map<String, DoctorDayScheduleConfig> getDayConfigs() {
        return dayConfigs;
    }

    public void setDayConfigs(Map<String, DoctorDayScheduleConfig> dayConfigs) {
        this.dayConfigs = dayConfigs;
    }
}
