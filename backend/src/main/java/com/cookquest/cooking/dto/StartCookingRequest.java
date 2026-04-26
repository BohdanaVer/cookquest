package com.cookquest.cooking.dto;

public record StartCookingRequest(
        String recipeJson,
        String signature
) {}