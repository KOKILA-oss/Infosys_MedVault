package com.example.demo.service;

import org.springframework.stereotype.Service;

import com.example.demo.entity.DoctorProfile;
import com.example.demo.entity.User;
import com.example.demo.repository.DoctorProfileRepository;
import com.example.demo.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class DoctorProfileService {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public DoctorProfileService(UserRepository userRepository,
                                DoctorProfileRepository doctorProfileRepository) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    // 🔹 GET PROFILE
    public DoctorProfile getMyProfile(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return doctorProfileRepository
                .findByUser(user)
                .orElseGet(() -> {
                    DoctorProfile profile = new DoctorProfile();
                    profile.setUser(user);
                    return doctorProfileRepository.save(profile);
                });
    }

    // 🔹 UPDATE PROFILE
    @Transactional
    public DoctorProfile updateMyProfile(String email, DoctorProfile updatedData) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        DoctorProfile profile = doctorProfileRepository
                .findByUser(user)
                .orElse(new DoctorProfile());

        profile.setUser(user);
        profile.setPhoneNumber(updatedData.getPhoneNumber());
        profile.setSpecialization(updatedData.getSpecialization());
        profile.setExperienceYears(updatedData.getExperienceYears());
        profile.setQualification(updatedData.getQualification());
        profile.setLicenseNumber(updatedData.getLicenseNumber());
        profile.setHospitalName(updatedData.getHospitalName());
        profile.setHospitalAddress(updatedData.getHospitalAddress());
        profile.setConsultationMode(updatedData.getConsultationMode());

        return doctorProfileRepository.save(profile);
    }
}

