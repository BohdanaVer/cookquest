package com.cookquest.recipe.dto;

public record StepDTO(
        String text,
        boolean isCheckpoint,
        String checkpointLabel
) {
}
