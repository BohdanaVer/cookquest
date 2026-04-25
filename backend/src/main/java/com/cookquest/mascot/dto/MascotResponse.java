package com.cookquest.mascot.dto;

public record MascotResponse(
        boolean success,
        String imageDataUrl,
        String prompt,
        String error
) {}