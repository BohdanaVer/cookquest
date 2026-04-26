package com.cookquest.cooking.dto;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record CookingSessionDto(
        Long sessionId,
        String recipeJson,
        String status,
        int earnedPoints,
        LocalDateTime startedAt
) {}