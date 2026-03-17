package com.example.demo.dto;

public class ChatResponse {

    private final String reply;

    public ChatResponse(String reply) {
        this.reply = reply;
    }

    public String getReply() {
        return reply;
    }
}
