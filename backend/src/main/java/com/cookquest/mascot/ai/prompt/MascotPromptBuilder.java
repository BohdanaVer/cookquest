package com.cookquest.mascot.ai.prompt;

import com.cookquest.mascot.dto.MascotConfig;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MascotPromptBuilder {

    public PromptData buildPrompt(MascotConfig config, String targetEmotion) {

        String subject = sanitize(config.subject(), 100);
        String extras = sanitize(config.extraDetails(), 200);

        String typeId = config.type() != null ? config.type().toLowerCase() : "chef";
        String styleId = config.style() != null ? config.style().toLowerCase() : "cartoon";
        String personalityId = config.personality() != null ? config.personality().toLowerCase() : "happy";
        String colorId = config.color() != null ? config.color().toLowerCase() : "red";

        String subjectPrompt = buildSubjectPrompt(typeId, subject);
        String styleHint = getStyleHint(styleId);
        String stylePreset = getStylePreset(styleId);

        String expressionHint = getExpressionHint(targetEmotion != null ? targetEmotion : personalityId);

        String colorPrompt = getColorPrompt(colorId);

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

    private String sanitize(String text, int maxLength) {
        if (text == null || text.isBlank()) {
            return "";
        }

        String sanitized = text.trim();

        if (sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized
                .replaceAll("[<>{}\\[\\]\\\\]", "")
                .replaceAll("\\n|\\r", " ")
                .replaceAll("\\s{2,}", " ")
                .replaceAll("(?i)ignore|system:|override|jailbreak|bypass", "")
                .trim();
    }

    private String buildSubjectPrompt(String typeId, String subject) {
        String concept = subject.trim();

        return switch (typeId) {
            case "ingredient" -> "cute anthropomorphic " + (concept.isEmpty() ? "tomato" : concept) + " food ingredient mascot character, round body with big expressive eyes, adorable smiling face, full body";
            case "dish" -> "cute anthropomorphic " + (concept.isEmpty() ? "bowl of borsch soup" : concept) + " dish mascot character, friendly bowl or plate shape with an expressive face, full body";
            case "appliance" -> "cute anthropomorphic " + (concept.isEmpty() ? "frying pan" : concept) + " kitchen appliance mascot character, cooking tool with a cute smiling face, full body";
            case "animal" -> "cute " + (concept.isEmpty() ? "bear" : concept) + " animal mascot character, adorable anthropomorphic animal character, full body";
            case "trophy" -> "cute golden " + (concept.isEmpty() ? "" : concept + " ") + "trophy award mascot character, shiny trophy cup with a cute smiling face, achievement mascot, full body";
            default -> (concept.isEmpty() ? "cute cartoon chef mascot character, wearing tall white toque blanche chef hat and double-breasted chef apron, holding a wooden ladle, friendly character, full body"
                    : "cute cartoon " + concept + " mascot character, friendly character, full body");
        };
    }

    private String buildNegativePrompt(String typeId) {
        String universal = "background, colored background, dark background, gradient background, textured background, pattern background, environment, scene, landscape, room, kitchen background, shadow on background, drop shadow, realistic photograph, photorealistic, photo, blurry, low quality, bad anatomy, deformed, ugly, disfigured, poorly drawn, extra limbs, multiple characters, text, letters, watermark, signature, logo, frame, border, nsfw, violence, gore";

        return switch (typeId) {
            case "ingredient" -> universal + ", real food photo, non-anthropomorphic food";
            case "dish" -> universal + ", real food photo, actual photograph of food";
            case "animal" -> universal + ", scary, aggressive, wild animal attack";
            default -> universal;
        };
    }

    private String getStyleHint(String style) {
        return switch (style) {
            case "3d" -> "3D rendered character, smooth surfaces, studio lighting, subsurface scattering, Pixar-like quality";
            case "pixel" -> "pixel art style, retro 16-bit game sprite, crisp pixels, limited color palette";
            case "chibi" -> "chibi style, super deformed proportions, oversized round head, tiny body, big sparkly eyes";
            case "flat" -> "flat vector illustration, geometric shapes, minimal shadows, clean modern design";
            case "fantasy" -> "fantasy illustration style, painterly details, magical aura, storybook quality";
            default -> "cartoon character design, bold outlines, clean linework, expressive features";
        };
    }

    private String getStylePreset(String style) {
        return switch (style) {
            case "3d" -> "3d-model";
            case "pixel" -> "pixel-art";
            case "chibi" -> "anime";
            case "flat" -> "digital-art";
            case "fantasy" -> "fantasy-art";
            default -> "comic-book";
        };
    }

    private String getExpressionHint(String state) {
        return switch (state) {
            case "sad" -> "sad drooping eyes, slight downward frown, melancholic dejected expression, slumped gentle pose, tearful glistening eyes";
            case "neutral" -> "calm neutral expression, relaxed composed face, subtle slight smile, no strong emotion, serene look";
            case "happy" -> "cheerful expression, wide bright smile, happy crinkled eyes, joyful exuberant expression, big grin, upbeat energetic pose";

            case "brave" -> "confident heroic pose, determined furrowed brows, chest out, strong bold stance";
            case "cute" -> "adorable rosy cheeks, innocent wide eyes, soft gentle expression, slightly blushing";
            case "wise" -> "thoughtful calm expression, wise knowing eyes, gentle smile, serene dignified pose";
            case "energetic" -> "dynamic action pose, excited open mouth, radiant motion lines, full of life";
            case "mischievous" -> "cheeky smirk, playful winking one eye, raised eyebrow, mischievous tilt of head";
            default -> "cheerful expression, wide bright smile, happy crinkled eyes, positive energetic pose";
        };
    }

    private String getColorPrompt(String color) {
        return switch (color) {
            case "orange" -> "warm orange and cream color palette";
            case "yellow" -> "sunny golden yellow and warm white color palette";
            case "green" -> "fresh bright green and mint color palette";
            case "blue" -> "sky blue and soft white color palette";
            case "purple" -> "royal purple and lavender color palette";
            case "pink" -> "bubbly pastel pink and white color palette";
            case "brown" -> "warm chocolate brown and tan color palette";
            case "gold" -> "luxurious gold and cream color palette, premium feel";
            case "rainbow" -> "vibrant multicolor rainbow palette, colorful and joyful";
            default -> "vibrant red and white color palette";
        };
    }

    public record PromptData(String prompt, String negativePrompt, String stylePreset) {}
}