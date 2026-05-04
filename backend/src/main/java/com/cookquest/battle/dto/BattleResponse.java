package com.cookquest.battle.dto;

import com.cookquest.cooking.dto.CookingSessionDto;

public record BattleResponse(
        Long battleId,
        String status,

        RecipePreviewDto recipePreview,

        CookingSessionDto mySession, 
        Integer myQualityScore,
        Integer mySpeedScore,
        Integer myTotalScore,

        String opponentName,
        boolean isOpponentFinished,
        Integer opponentTotalScore,

        Long winnerId,       
        Integer myEarnedXp,
        Integer myEarnedCoins
) {}
