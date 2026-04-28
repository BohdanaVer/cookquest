package com.cookquest.recipe.dto;

import java.util.List;

public record GenerateAdminRecipeRequest(
        List<String> ingredients,
        String textQuery,
        String challengeCuisine,
        int count,
        String requestLanguage
) {}
