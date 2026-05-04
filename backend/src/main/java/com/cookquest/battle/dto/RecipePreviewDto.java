package com.cookquest.battle.dto;

import java.util.List;

public record RecipePreviewDto(
        String name,
        String description,
        String difficulty,
        Integer points,
        Integer cookingTimeMinutes,
        String cuisine,
        List<String> dietaryTags,
        List<Object> ingredients,
        int stepsCount
) {}