package com.cookquest.quest.dto;

public record QuestRequestDTO(
        String recipeId,
        Long dayId,
        Double xpMultiplier,
        String cuisineName
) {}