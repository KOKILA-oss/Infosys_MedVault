package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    public void sendOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (fromEmail != null && !fromEmail.isBlank()) {
            message.setFrom(fromEmail);
        }
        message.setTo(toEmail);
        message.setSubject("MedVault OTP Verification");
        message.setText("Your OTP is: " + otp + "\nValid for 5 minutes.");
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("Failed to send OTP email to {}", toEmail, ex);
            throw new IllegalStateException("Unable to send OTP email right now. Please try again.");
        }
    }
}
