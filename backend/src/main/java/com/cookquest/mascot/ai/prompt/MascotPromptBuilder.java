package com.cookquest.mascot.ai.prompt;

import com.cookquest.mascot.dto.MascotConfig;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Original logic and prompt engineering ported from JavaScript.
 * Preserves the exact behavior of mascotPrompt.js
 */
@Component
public class MascotPromptBuilder {

    public PromptData buildPrompt(MascotConfig config) {
        String subject = sanitize(config.subjectName());
        String extras = sanitize(config.extraDetails());
        String typeId = config.type() != null ? config.type().toLowerCase() : "chef";

        // 1. Формуємо суб'єкт (Subject)
        String subjectPrompt = buildSubjectPrompt(typeId, subject, extras);

        // 2. Стиль та Емоція (Спрощено для прикладу, можна розширити всіма константами з JS)
        String styleHint = getStyleHint(config.style());
        String stylePreset = getStylePreset(config.style());
        String expressionHint = getExpressionHint(config.personality(), config.emotion());
        String colorPrompt = getColorPrompt(config.color());

        // 3. Фіксовані якорі для якості та фону (Fixed anchors)
        List<String> fixedAnchors = List.of(
                "pure white background",
                "solid white background only",
                "isolated character on white",
                "no background elements",
                "full body character",
                "centered composition",
                "mascot illustration",
                "no text, no letters, no watermark",
                "masterpiece, best quality, sharp clean details, high resolution"
        );

        // Збираємо все разом
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append(subjectPrompt).append(", ")
                .append(styleHint).append(", ")
                .append(expressionHint).append(", ")
                .append(colorPrompt);

        if (!extras.isEmpty()) {
            promptBuilder.append(", ").append(extras);
        }

        promptBuilder.append(", ").append(String.join(", ", fixedAnchors));

        String negativePrompt = buildNegativePrompt(typeId);

        return new PromptData(promptBuilder.toString(), negativePrompt, stylePreset);
    }

    private String buildSubjectPrompt(String typeId, String subject, String extras) {
        String concept = !extras.isEmpty() ? extras : (!subject.isEmpty() ? subject : "");
        return switch (typeId) {
            case "ingredient" -> "cute anthropomorphic " + (concept.isEmpty() ? "tomato" : concept) + " food ingredient mascot character, round body with big expressive eyes, tiny stubby arms and legs, adorable smiling face, full body";
            case "dish" -> "cute anthropomorphic " + (concept.isEmpty() ? "bowl of borsch soup" : concept) + " dish mascot character, friendly bowl or plate shape with an expressive face, tiny arms, charming cooking mascot, full body";
            case "animal" -> "cute " + (concept.isEmpty() ? "bear" : concept) + " animal chef mascot character, wearing a chef hat and apron, adorable anthropomorphic animal cooking character, full body";
            default -> (concept.isEmpty() ? "cute cartoon chef mascot character, wearing tall white toque blanche chef hat and double-breasted chef apron, holding a wooden ladle, friendly cooking character, full body"
                    : "cute cartoon " + concept + " mascot character, chef theme, wearing chef hat and apron, friendly cooking character, full body");
        };
    }

    private String buildNegativePrompt(String typeId) {
        return "colored background, background, dark background, gradient background, textured background, pattern background, environment, scene, landscape, room, kitchen background, shadow on background, drop shadow, realistic photograph, photorealistic, photo, blurry, low quality, bad anatomy, deformed, ugly, disfigured, poorly drawn, extra limbs, multiple characters, text, letters, watermark, signature, logo, frame, border, nsfw, violence, gore";
    }

    private String sanitize(String text) {
        if (text == null) return "";
        return text.trim().replaceAll("[<>{}\\[\\]\\\\]", "").replaceAll("\\n|\\r", "");
    }

    private String getStyleHint(String style) {
        if ("3d".equalsIgnoreCase(style)) return "3D rendered character, smooth surfaces, studio lighting, subsurface scattering, Pixar-like quality";
        if ("pixel".equalsIgnoreCase(style)) return "pixel art style, retro 16-bit game sprite, crisp pixels, limited color palette";
        return "cartoon character design, bold outlines, clean linework, expressive features"; // default cartoon
    }

    private String getStylePreset(String style) {
        if ("3d".equalsIgnoreCase(style)) return "3d-model";
        if ("pixel".equalsIgnoreCase(style)) return "pixel-art";
        return "comic-book"; // default cartoon
    }

    private String getExpressionHint(String personality, String emotion) {
        if ("sad".equalsIgnoreCase(emotion)) return "sad drooping eyes, slight downward frown, melancholic dejected expression, slumped gentle pose, tearful glistening eyes";
        return "cheerful expression, wide bright smile, happy crinkled eyes, positive energetic pose"; // default happy
    }

    private String getColorPrompt(String color) {
        if ("blue".equalsIgnoreCase(color)) return "sky blue and soft white color palette";
        if ("green".equalsIgnoreCase(color)) return "fresh bright green and mint color palette";
        return "vibrant red and white color palette"; // default red
    }

    public record PromptData(String prompt, String negativePrompt, String stylePreset) {}
}
