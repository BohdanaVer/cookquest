package com.cookquest.mascot.dto;

public record MascotConfig(
        String name,
        String description,
        String type,
        String subject,
        String style,
        String personality,
        String color,
        String extraDetails
) {}