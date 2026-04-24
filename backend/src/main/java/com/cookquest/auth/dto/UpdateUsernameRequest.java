package com.cookquest.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUsernameRequest(
        @NotBlank(message = "Ім'я не може бути порожнім")
        @Size(min = 3, max = 50, message = "Ім'я має містити від 3 до 50 символів")
        String newUsername
) {}
