package com.example.demo.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Appointment;
import com.example.demo.entity.AppointmentStatus;
import com.example.demo.entity.User;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByDoctorAndAppointmentDateAndAppointmentTime(
            User doctor,
            LocalDate date,
            LocalTime time
    );

    List<Appointment> findByPatient(User patient);

List<Appointment> findByDoctor(User doctor);

List<Appointment> findByPatientAndStatus(User patient, AppointmentStatus status);

List<Appointment> findByDoctorAndStatus(User doctor, AppointmentStatus status);

}

