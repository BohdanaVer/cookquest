package com.cookquest.battle.dto;

public record BattleParticipantDto(
        Long userId,
        Long cookingSessionId, 
        boolean isFinished,
        
        Integer qualityScore,
        Integer speedScore,
        Integer totalScore,
        
        Integer earnedXp,
        Integer earnedCoins
) {}
