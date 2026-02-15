package com.example.demo.dto;

import com.example.demo.entity.Role;

public class VerifyOtpRequest {
    public String name;
    public String email;
    public String password;
    public Role role;
    public String otp;
}
