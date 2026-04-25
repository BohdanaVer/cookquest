package com.cookquest.recipe.ai.validator;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Original logic and prompt injection defense ported from outputValidator.js
 */

@Slf4j
@Component
public class OutputValidator {

    private static final int RECIPE_POINTS_MIN = 10;
    private static final int RECIPE_POINTS_MAX = 500;
    private static final int RECIPE_NAME_MAX = 100;
    private static final int RECIPE_DESCRIPTION_MAX = 500;
    private static final int STEP_TEXT_MAX = 800;
    private static final int INGREDIENT_NAME_MAX = 120;
    private static final int INGREDIENTS_MAX = 40;
    private static final int STEPS_MAX = 40;
    private static final int RECIPES_COUNT_MIN = 1;
    private static final int RECIPES_COUNT_MAX = 4;

    private final List<String> DIFFICULTY_LEVELS = List.of("easy", "medium", "hard");

    public String clampString(String str, int max) {
        if (str == null) return "";
        String trimmed = str.trim();
        return trimmed.length() > max ? trimmed.substring(0, max) : trimmed;
    }

    public int clampNumber(JsonNode node, int min, int max, int fallback) {
        if (node == null || !node.isNumber()) return fallback;
        int val = node.asInt();
        return Math.min(max, Math.max(min, val));
    }

    public boolean isSuspicious(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return lower.matches(".*ignore\\s+(all\\s+)?previous.*") ||
                lower.matches(".*give\\s+(user|them)\\s+\\d+.*") ||
                lower.matches(".*grant\\s+\\d+\\s*points.*") ||
                lower.matches(".*system\\s*:.*") ||
                lower.matches(".*<\\s*script.*");
    }

    public List<String> validateIngredientDetection(JsonNode arrayNode) {
        if (arrayNode == null || !arrayNode.isArray()) return List.of();

        List<String> ingredients = new ArrayList<>();
        for (int i = 0; i < Math.min(arrayNode.size(), 50); i++) {
            String item = arrayNode.get(i).asText();
            String clamped = clampString(item, INGREDIENT_NAME_MAX);
            if (!clamped.isEmpty() && !isSuspicious(clamped)) {
                ingredients.add(clamped);
            }
        }
        return ingredients;
    }

    public List<JsonNode> validateRecipeList(JsonNode rootNode) {
        if (rootNode == null) {
            log.error("AI output is null");
            return List.of();
        }

        JsonNode arrayNode = rootNode;
        if (rootNode.isObject() && rootNode.has("recipes")) {
            arrayNode = rootNode.get("recipes");
        }

        if (!arrayNode.isArray()) {
            log.error("AI output is not an array and does not contain a 'recipes' array");
            return List.of();
        }

        List<JsonNode> validatedRecipes = new ArrayList<>();
        for (int i = 0; i < Math.min(arrayNode.size(), RECIPES_COUNT_MAX); i++) {
            JsonNode recipe = arrayNode.get(i);
            if (isValidRecipe(recipe)) {
                validatedRecipes.add(recipe);
            }
        }

        return validatedRecipes.size() >= RECIPES_COUNT_MIN ? validatedRecipes : List.of();
    }

    private boolean isValidRecipe(JsonNode recipe) {
        if (recipe == null || !recipe.isObject()) return false;

        String name = clampString(recipe.path("name").asText(), RECIPE_NAME_MAX);
        String description = clampString(recipe.path("description").asText(), RECIPE_DESCRIPTION_MAX);

        if (name.isEmpty() || isSuspicious(name) || isSuspicious(description)) {
            return false;
        }

        JsonNode ingredients = recipe.path("ingredients");
        JsonNode steps = recipe.path("steps");

        if (!ingredients.isArray() || ingredients.isEmpty() || ingredients.size() > INGREDIENTS_MAX) return false;
        if (!steps.isArray() || steps.isEmpty() || steps.size() > STEPS_MAX) return false;

        String difficulty = recipe.path("difficulty").asText();
        if (!DIFFICULTY_LEVELS.contains(difficulty.toLowerCase())) {
            return false;
        }

        int points = clampNumber(recipe.path("points"), RECIPE_POINTS_MIN, RECIPE_POINTS_MAX, 50);

        return true;
    }
}