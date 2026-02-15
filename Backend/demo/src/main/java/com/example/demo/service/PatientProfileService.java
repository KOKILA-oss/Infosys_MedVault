package com.example.demo.service;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.PatientProfile;
import com.example.demo.entity.User;
import com.example.demo.repository.PatientProfileRepository;
import com.example.demo.repository.UserRepository;

@Service
public class PatientProfileService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;

    public PatientProfileService(UserRepository userRepository,
                                 PatientProfileRepository patientProfileRepository) {
        this.userRepository = userRepository;
        this.patientProfileRepository = patientProfileRepository;
    }

    // 🔹 GET PROFILE
    public PatientProfile getMyProfile(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return patientProfileRepository
                .findByUser(user)
                .orElseGet(() -> {
                    PatientProfile profile = new PatientProfile();
                    profile.setUser(user);
                    return patientProfileRepository.save(profile);
                });
    }

    // 🔹 UPDATE PROFILE
    @Transactional
    public PatientProfile updateMyProfile(String email, PatientProfile updatedData) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PatientProfile profile = patientProfileRepository
                .findByUser(user)
                .orElse(new PatientProfile());

        profile.setUser(user);
        profile.setPhoneNumber(updatedData.getPhoneNumber());
        profile.setGender(updatedData.getGender());
        profile.setBloodGroup(updatedData.getBloodGroup());
        profile.setHeight(updatedData.getHeight());
        profile.setWeight(updatedData.getWeight());
        profile.setSugarLevel(updatedData.getSugarLevel());
        profile.setAddress(updatedData.getAddress());
        profile.setAllergies(updatedData.getAllergies());
        profile.setEmergencyContact(updatedData.getEmergencyContact());

        return patientProfileRepository.save(profile);
    }
}
