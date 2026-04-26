package com.cookquest.recipe.dto;
import java.util.List;

public record RecipeItem(
        String name,
        String description,
        String difficulty,
        int points,
        int cookingTimeMinutes,
        String cuisine,
        List<String> dietaryTags,
        List<IngredientDTO> ingredients,
        int stepCount,
        String id
) {}