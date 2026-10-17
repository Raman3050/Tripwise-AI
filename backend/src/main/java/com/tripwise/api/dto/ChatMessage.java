package com.tripwise.api.dto;

public record ChatMessage(
        String role,
        String content,
        String timestamp
) {}
