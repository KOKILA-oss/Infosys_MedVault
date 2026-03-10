package com.example.demo.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.dto.AppointmentStatus;
import com.example.demo.entity.Appointment;

import com.example.demo.entity.User;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByDoctorAndAppointmentDateAndAppointmentTime(
            User doctor,
            LocalDate date,
            LocalTime time
    );

    List<Appointment> findByPatient(User patient);


List<Appointment> findByDoctor(User doctor);

List<Appointment> findByDoctorId(Long doctorId);
List<Appointment> findByPatientAndStatus(User patient, AppointmentStatus status);

List<Appointment> findByDoctorAndStatus(User doctor, AppointmentStatus status);

List<Appointment> findByDoctorEmailAndAppointmentDateAndStatus(
        String email,
        LocalDate date,
        AppointmentStatus status
    );

    List<Appointment> findByPatientAndAppointmentDateGreaterThanEqual(
        User patient,
        LocalDate date
);

    List<Appointment> findByDoctorAndAppointmentDate(User doctor, LocalDate date);

    boolean existsByDoctorAndAppointmentDateAndAppointmentTimeAndIdNot(
        User doctor,
        LocalDate date,
        LocalTime time,
        Long id
);

}



