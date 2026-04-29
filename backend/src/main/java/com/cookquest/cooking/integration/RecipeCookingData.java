package com.cookquest.cooking.integration;

public record RecipeCookingData(
        String id,
        Long authorId,
        String batchId,
        String recipeJson,
        boolean isUnlocked
) {}
