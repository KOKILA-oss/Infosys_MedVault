package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.ChatResponse;
import com.example.demo.dto.ChatRequest;
import com.example.demo.service.ChatService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ChatResponse chat(@RequestBody ChatRequest request,
                             HttpServletRequest httpRequest) {

        String authHeader = httpRequest.getHeader("Authorization");

        String token = null;

        if(authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        return new ChatResponse(chatService.getChatResponse(request.getMessage(), token));
    }
}
