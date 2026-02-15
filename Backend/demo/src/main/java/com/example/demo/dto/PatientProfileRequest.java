package com.example.demo.dto;

import jakarta.validation.constraints.Min;

public class PatientProfileRequest {

    @Min(0)
    public Integer age;

    public String gender;
    public String bloodGroup;
    public String address;

    public Double height;
    public Double weight;
    public Double sugarLevel;

    public Integer bpSystolic;
    public Integer bpDiastolic;

    public String allergies;
    public String emergencyContact;
}
