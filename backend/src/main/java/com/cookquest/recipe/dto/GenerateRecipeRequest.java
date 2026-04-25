package com.cookquest.recipe.dto;

import java.util.List;

public record GenerateRecipeRequest(
        String textQuery,
        List<String> ingredients,
        String requestLanguage
) {}

