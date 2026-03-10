package com.example.demo.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Reminder;
import com.example.demo.entity.User;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findByPatientOrderByDueDateAsc(User patient);

    List<Reminder> findByNotifiedFalseAndDueDateLessThanEqual(LocalDate date);
}
