package com.cookquest.mascot.dto;

public record MascotConfig(
        String type,
        String style,
        String personality,
        String color,
        String subjectName,
        String extraDetails,
        String emotion
) {}