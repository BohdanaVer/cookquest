package com.cookquest.cooking.integration;

import com.cookquest.cooking.integration.RecipeCookingData;

/**
 * Публічний API, який Готування вимагає від модуля Рецептів.
 */
public interface RecipeIntegrationService {

    // Отримати необхідні для готування дані рецепта без прив'язки до Entity
    RecipeCookingData getRecipeData(String recipeId);

    // Команда на розблокування рецепта (спалювання для батлів)
    void unlockRecipe(String recipeId);
}