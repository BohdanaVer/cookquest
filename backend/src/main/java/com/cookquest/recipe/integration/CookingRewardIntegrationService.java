package com.cookquest.recipe.integration;

public interface CookingRewardIntegrationService {
    int calculatePotentialPoints(Long userId, String recipeId, String batchId, Long authorId, int basePoints);
}