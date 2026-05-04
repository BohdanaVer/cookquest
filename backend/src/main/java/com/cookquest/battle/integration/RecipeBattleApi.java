package com.cookquest.battle.integration;

import com.cookquest.battle.dto.RecipePreviewDto;

public interface RecipeBattleApi {
    boolean isRecipeValidForBattle(String recipeId);

    int getBasePoints(String recipeId);

    int getCookingTimeMinutes(String recipeId);

    RecipePreviewDto getRecipePreview(String recipeId);
}
