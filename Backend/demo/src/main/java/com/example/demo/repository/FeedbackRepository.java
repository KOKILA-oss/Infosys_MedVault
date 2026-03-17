package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Appointment;
import com.example.demo.entity.Feedback;
import com.example.demo.entity.User;

    public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    boolean existsByAppointment(Appointment appointment);

    List<Feedback> findByDoctor(User doctor);
    List<Feedback> findByPatient(User patient);
}
