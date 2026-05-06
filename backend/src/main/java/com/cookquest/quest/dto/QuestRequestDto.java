package com.cookquest.quest.dto;

public record QuestRequestDto(
        String recipeId,
        Long dayId,
        Double xpMultiplier,
        String cuisineName
) {}