package com.example.demo.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.example.demo.entity.Reminder;
import com.example.demo.entity.ReminderType;

public class ReminderResponse {

    private Long id;
    private ReminderType type;
    private String message;
    private LocalDate dueDate;
    private boolean notified;
    private LocalDateTime createdAt;
    private LocalDateTime notifiedAt;

    public ReminderResponse() {
    }

    public ReminderResponse(Reminder reminder) {
        this.id = reminder.getId();
        this.type = reminder.getType();
        this.message = reminder.getMessage();
        this.dueDate = reminder.getDueDate();
        this.notified = reminder.isNotified();
        this.createdAt = reminder.getCreatedAt();
        this.notifiedAt = reminder.getNotifiedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ReminderType getType() {
        return type;
    }

    public void setType(ReminderType type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public boolean isNotified() {
        return notified;
    }

    public void setNotified(boolean notified) {
        this.notified = notified;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getNotifiedAt() {
        return notifiedAt;
    }

    public void setNotifiedAt(LocalDateTime notifiedAt) {
        this.notifiedAt = notifiedAt;
    }
}
