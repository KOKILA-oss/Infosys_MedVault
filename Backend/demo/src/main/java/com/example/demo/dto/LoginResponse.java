package com.example.demo.dto;

public class LoginResponse {

    private String token;
    private String name;
    private String role;
    private String email;

    public LoginResponse(String token, String name, String role, String email) {
        this.token = token;
        this.name = name;
        this.role = role;
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public String getEmail() {
        return email;
    }

    // getters
}
