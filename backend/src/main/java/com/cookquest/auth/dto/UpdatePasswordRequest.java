package com.cookquest.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePasswordRequest(
        @NotBlank(message = "Поточний пароль обов'язковий")
        String currentPassword,

        @NotBlank(message = "Новий пароль не може бути порожнім")
        @Size(min = 6, message = "Новий пароль має містити мінімум 6 символів")
        String newPassword
) {}
