package com.cookquest.recipe.ai.validator;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Original logic and prompt injection defense ported from inputSanitizer.js
 */
@Component
public class InputSanitizer {

    private static final int MAX_TEXT_LENGTH = 500;
    private static final int MAX_INGREDIENT_NAME_LENGTH = 50;

    private static final List<Pattern> INJECTION_PATTERNS = List.of(
            Pattern.compile("(?i)ignore\\s+(all\\s+)?(previous|prior|above|earlier)\\s+(instructions?|prompts?|rules?|directions?|context)"),
            Pattern.compile("(?i)forget\\s+(everything|all|what your)"),
            Pattern.compile("(?i)you\\s+are\\s+now\\s+(a|an|the)"),
            Pattern.compile("(?i)act\\s+as\\s+(a|an|the|if)"),
            Pattern.compile("(?i)pretend\\s+(to\\s+be|you\\s+are)"),
            Pattern.compile("(?i)roleplay\\s+as"),
            Pattern.compile("(?i)new\\s+(instructions?|rules?|prompt|task|role|persona)"),
            Pattern.compile("(?i)system\\s*:"),
            Pattern.compile("(?i)\\[system\\]"),
            Pattern.compile("(?i)\\[user\\]"),
            Pattern.compile("(?i)<\\s*system\\s*>"),
            Pattern.compile("(?i)disregard\\s+(your|all|previous)"),
            Pattern.compile("(?i)override\\s+(your|all|previous|the)"),
            Pattern.compile("(?i)bypass\\s+(your|all|the|safety)"),
            Pattern.compile("(?i)jailbreak"),
            Pattern.compile("(?i)do\\s+anything\\s+now"),
            Pattern.compile("(?i)dan\\s+mode"),
            Pattern.compile("(?i)developer\\s+mode"),
            Pattern.compile("(?i)give\\s+me\\s+\\d+\\s*(points?|балів|бали)"),
            Pattern.compile("(?i)add\\s+\\d+\\s*(points?|балів|бали)"),
            Pattern.compile("(?i)grant\\s+(me|us)\\s+\\d+"),
            // Українські патерни
            Pattern.compile("(?i)ігноруй\\s+(всі\\s+)?(попередні|минулі)\\s+(інструкції|правила)"),
            Pattern.compile("(?i)забудь\\s+(все|всі|про)"),
            Pattern.compile("(?i)ти\\s+тепер\\s+(є|будеш)"),
            Pattern.compile("(?i)нові\\s+інструкції"),
            Pattern.compile("(?i)додай\\s+мені\\s+\\d+\\s*(балів|бали)")
    );

    public boolean containsInjection(String text) {
        if (text == null) return false;
        return INJECTION_PATTERNS.stream().anyMatch(pattern -> pattern.matcher(text).find());
    }

    public SanitizeResult sanitizeUserComment(String rawText) {
        if (rawText == null) return new SanitizeResult(false, "", "invalid_type", "Некоректний тип");

        String trimmed = rawText.trim();
        if (trimmed.isEmpty()) return new SanitizeResult(true, "", null, null);

        if (trimmed.length() > MAX_TEXT_LENGTH) {
            return new SanitizeResult(false, "", "too_long", "Коментар не може перевищувати " + MAX_TEXT_LENGTH + " символів");
        }

        if (containsInjection(trimmed)) {
            return new SanitizeResult(false, "", "injection_detected", "Некоректний запит. Опишіть страву або побажання звичайними словами.");
        }

        String sanitized = trimmed
                .replaceAll("`", "'")
                .replaceAll("\\$\\{[^}]*\\}", "")
                .replaceAll("", "")
                .replaceAll("<[^>]+>", "")
                .replaceAll("\"", "\\\\\"");

        return new SanitizeResult(true, sanitized, null, null);
    }

    public List<String> sanitizeIngredientList(List<String> ingredients) {
        if (ingredients == null || ingredients.size() > 100) return List.of();

        return ingredients.stream()
                .filter(item -> item != null && !item.trim().isEmpty())
                .map(String::trim)
                .filter(trimmed -> trimmed.length() <= MAX_INGREDIENT_NAME_LENGTH)
                .filter(trimmed -> !containsInjection(trimmed))
                .map(trimmed -> trimmed.replaceAll("[^\\p{L}\\p{N}\\s\\-.,()]", "").trim())
                .filter(cleaned -> !cleaned.isEmpty())
                .toList();
    }

    public record SanitizeResult(boolean safe, String sanitized, String reason, String message) {}
}