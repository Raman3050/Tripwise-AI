package com.tripwise.api.dto;

public record AuthResponse(
        String token,
        UserDto user,
        String message
) {}
