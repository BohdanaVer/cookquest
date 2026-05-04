package com.cookquest.cooking.dto;

import lombok.Builder;

@Builder
public record StepVerificationResponse(
        int score,
        boolean passed,
        String feedback,
        boolean bonusEligible,
        String sessionStatus,
        int currentStepIndex,
        int earnedPointsForStep
) {}