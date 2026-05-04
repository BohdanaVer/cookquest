package com.cookquest.cooking.integration;

public interface RecipeIntegrationService {

    RecipeCookingData getRecipeData(String recipeId);

    void unlockRecipe(String recipeId);
}