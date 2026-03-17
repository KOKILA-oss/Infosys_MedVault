package com.example.demo.dto;

public class DoctorSummary {
    private Long id;
    private String name;
    private String email;
    private String specialization;
    private String hospitalName;
    private double averageRating;
    private long reviewCount;

    public DoctorSummary() {}

    public DoctorSummary(Long id, String name, String email, String specialization, String hospitalName, double averageRating, long reviewCount) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.specialization = specialization;
        this.hospitalName = hospitalName;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public void setHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public long getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(long reviewCount) {
        this.reviewCount = reviewCount;
    }
}
