package com.cookquest.battle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateBattleRequest(
        @NotBlank(message = "ID рецепта є обов'язковим")
        String recipeId,
        @NotBlank(message = "Ім'я суперника є обов'язковим")
        String targetUsername
) {}
