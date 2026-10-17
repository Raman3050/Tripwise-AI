package com.tripwise.api.dto;

public record AuthRequest(
        String credential,
        boolean demo,
        String email,
        String name,
        String pictureUrl
) {}
