package com.example.demo.dto;

import java.time.LocalDate;

import com.example.demo.entity.ReminderType;

public class ReminderRequest {

    private ReminderType type;
    private String message;
    private LocalDate dueDate;

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
}
