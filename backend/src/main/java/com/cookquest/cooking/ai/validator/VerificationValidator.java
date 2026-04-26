package com.cookquest.cooking.ai.validator;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class VerificationValidator {

    public StepVerificationResult validate(JsonNode raw) {
        if (raw == null || !raw.isObject()) {
            return new StepVerificationResult(0, false, "Помилка відповіді ШІ", false, false);
        }

        int score = raw.path("score").asInt(0);
        score = Math.max(0, Math.min(100, score));

        boolean passed = raw.has("passed") ? raw.path("passed").asBoolean() : score >= 50;

        String feedback = raw.path("feedback").asText("");
        if (feedback.length() > 300) {
            feedback = feedback.substring(0, 300);
        }

        boolean bonusEligible = score >= 80 && passed;

        return new StepVerificationResult(score, passed, feedback, bonusEligible, true);
    }

    public record StepVerificationResult(
            int score, boolean passed, String feedback, boolean bonusEligible, boolean valid
    ) {}
}