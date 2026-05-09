package com.cookquest.battle.integration;

import com.cookquest.cooking.dto.CookingSessionDto;

public interface CookingBattleApi {
    void burnBatch(Long userId, String recipeId);

    Long startBattleCookingSession(Long userId, String recipeId);

    boolean isSessionCancelled(Long sessionId);

    int getAiQualityScore(Long sessionId);

    int getCookingTimeSpentMinutes(Long sessionId);

    CookingSessionDto getSessionDetails(Long sessionId);

    boolean isRecipeAlreadyUsed(Long userId, String recipeId);

    void cancelSession(Long sessionId);

    boolean sessionExists(Long sessionId);
}
