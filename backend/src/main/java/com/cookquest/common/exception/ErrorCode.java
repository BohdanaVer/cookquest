package com.cookquest.common.exception;

public enum ErrorCode {
    // Користувачі
    USER_NOT_FOUND,
    EMAIL_ALREADY_EXISTS,
    INVALID_PASSWORD,

    // ШІ та Рецепти
    RECIPE_NOT_FOUND,
    AI_GENERATION_FAILED,

    // Системні
    INTERNAL_SERVER_ERROR,
    VALIDATION_ERROR
}