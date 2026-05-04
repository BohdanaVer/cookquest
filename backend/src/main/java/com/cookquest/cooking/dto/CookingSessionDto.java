package com.cookquest.cooking.dto;

import com.cookquest.cooking.entity.XpMode;
import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record CookingSessionDto(
        Long sessionId,
        Object recipe,
        String status,
        int earnedPoints,
        LocalDateTime startedAt,
        String batchId,
        XpMode xpMode
) {}