package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.demo.repository.EmailOtpRepository;
import com.example.demo.repository.PatientProfileRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.EmailService;

import jakarta.transaction.Transactional;

import com.example.demo.entity.EmailOtp;
import com.example.demo.entity.User;
import com.example.demo.dto.ForgotPasswordRequest;
import com.example.demo.dto.ForgotPasswordVerifyRequest;
import com.example.demo.dto.LoginOtpRequest;
import com.example.demo.dto.LoginOtpVerifyRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.OtpRequest;
import com.example.demo.dto.ResetPasswordRequest;
import com.example.demo.dto.VerifyOtpRequest;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailOtpRepository emailOtpRepository;
    private final EmailService emailService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder, JwtUtil jwtUtil, EmailOtpRepository emailOtpRepository,
                      EmailService emailService, PatientProfileRepository patientProfileRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailOtpRepository = emailOtpRepository;
    this.emailService = emailService;
    }


@PostMapping("/register/request-otp")
public String requestOtp(@RequestBody OtpRequest request) {

    if (userRepository.findByEmail(request.email).isPresent()) {
        return "Email already registered";
    }

    String otp = String.valueOf((int)(Math.random() * 900000) + 100000);

    Optional<EmailOtp> optionalOtp = emailOtpRepository.findByEmail(request.email);

    EmailOtp emailOtp = optionalOtp.orElse(new EmailOtp());

    emailOtp.setEmail(request.email);
    emailOtp.setOtp(otp);
    emailOtp.setExpiryTime(LocalDateTime.now().plusMinutes(5));

    emailOtpRepository.save(emailOtp);
    emailService.sendOtp(request.email, otp);

    return "OTP sent to email";
}

@PostMapping("/register/verify-otp")
@Transactional
public String verifyOtpAndRegister(@RequestBody VerifyOtpRequest request) {

    EmailOtp emailOtp = emailOtpRepository.findByEmail(request.email)
            .orElseThrow(() -> new RuntimeException("OTP not found"));

    if (emailOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
        return "OTP expired";
    }

    if (!emailOtp.getOtp().equals(request.otp)) {
        return "Invalid OTP";
    }

    if (userRepository.findByEmail(request.email).isPresent()) {
        return "Email already registered";
    }

    User user = new User();
    user.setName(request.name);
    user.setEmail(request.email);
    user.setPassword(passwordEncoder.encode(request.password));
    user.setRole(request.role);

      // ✅ IMPORTANT: capture saved user

    userRepository.save(user);

    // ✅ Delete OTP
    emailOtpRepository.delete(emailOtp);


    return "Registration successful";
}

@PostMapping("/login/request-otp")
public ResponseEntity<?> requestLoginOtp(@RequestBody LoginOtpRequest request) {

    Optional<User> optionalUser = userRepository.findByEmail(request.email);

    if (optionalUser.isEmpty()) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body("User not found");
    }

    User user = optionalUser.get();

    if (!passwordEncoder.matches(request.password, user.getPassword())) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body("Invalid credentials");
    }

    emailOtpRepository.deleteByEmail(request.email);

    String otp = String.valueOf((int)(Math.random() * 900000) + 100000);

    EmailOtp emailOtp = new EmailOtp();
    emailOtp.setEmail(request.email);
    emailOtp.setOtp(otp);
    emailOtp.setExpiryTime(LocalDateTime.now().plusMinutes(5));

    emailOtpRepository.save(emailOtp);
    try {
        emailService.sendOtp(request.email, otp);
        return ResponseEntity.ok("Login OTP sent to email");
    } catch (IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ex.getMessage());
    }
}

@PostMapping("/login/resend-otp")
public ResponseEntity<?> resendLoginOtp(@RequestBody OtpRequest request) {

    User user = userRepository.findByEmail(request.email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    emailOtpRepository.deleteByEmail(request.email);

    String otp = String.valueOf((int)(Math.random() * 900000) + 100000);

    EmailOtp emailOtp = new EmailOtp();
    emailOtp.setEmail(request.email);
    emailOtp.setOtp(otp);
    emailOtp.setExpiryTime(LocalDateTime.now().plusMinutes(5));

    emailOtpRepository.save(emailOtp);
    try {
        emailService.sendOtp(request.email, otp);
        return ResponseEntity.ok("OTP resent successfully");
    } catch (IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ex.getMessage());
    }
}


@PostMapping("/login/verify-otp")
@Transactional
public ResponseEntity<?> verifyLoginOtp(@RequestBody LoginOtpVerifyRequest request) {

    EmailOtp emailOtp = emailOtpRepository.findByEmail(request.email)
            .orElseThrow(() -> new RuntimeException("OTP not found"));

    if (emailOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("OTP expired");
    }

    if (!emailOtp.getOtp().equals(request.otp)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid OTP");
    }

    User user = userRepository.findByEmail(request.email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    emailOtpRepository.delete(emailOtp);

    String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

    LoginResponse response = new LoginResponse(
            token,
            user.getName(),
            user.getRole().name(),
            user.getEmail()
    );

    return ResponseEntity.ok(response);
}


@PostMapping("/forgot-password/request-otp")
public ResponseEntity<?> requestForgotPasswordOtp(
        @RequestBody ForgotPasswordRequest request) {

    Optional<User> optionalUser = userRepository.findByEmail(request.email);

    if (optionalUser.isEmpty()) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body("User not found");
    }

    String otp = String.valueOf((int)(Math.random() * 900000) + 100000);

    Optional<EmailOtp> optionalOtp = emailOtpRepository.findByEmail(request.email);
    EmailOtp emailOtp = optionalOtp.orElse(new EmailOtp());

    emailOtp.setEmail(request.email);
    emailOtp.setOtp(otp);
    emailOtp.setExpiryTime(LocalDateTime.now().plusMinutes(5));

    emailOtpRepository.save(emailOtp);
    try {
        emailService.sendOtp(request.email, otp);
        return ResponseEntity.ok("Reset OTP sent successfully");
    } catch (IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ex.getMessage());
    }
}

@PostMapping("/forgot-password/verify-otp")
public ResponseEntity<?> verifyForgotPasswordOtp(@RequestBody ForgotPasswordVerifyRequest request) {

    EmailOtp emailOtp = emailOtpRepository.findByEmail(request.email)
            .orElseThrow(() -> new RuntimeException("OTP not found"));

    if (emailOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("OTP expired");
    }

    if (!emailOtp.getOtp().equals(request.otp)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid OTP");
    }

    return ResponseEntity.ok("OTP verified");
}

@PostMapping("/forgot-password/reset")
@Transactional
public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {

    User user = userRepository.findByEmail(request.email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    user.setPassword(passwordEncoder.encode(request.newPassword));
    userRepository.save(user);

    emailOtpRepository.deleteByEmail(request.email);

    return ResponseEntity.ok("Password reset successful");
}


}
