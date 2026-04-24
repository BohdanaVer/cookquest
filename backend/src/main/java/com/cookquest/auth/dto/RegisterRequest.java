package com.cookquest.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "REQUIRED_FIELD")
        @Size(min = 2, max = 50, message = "INVALID_LENGTH_2_50")
        String username,

        @NotBlank(message = "REQUIRED_FIELD")
        @Email(message = "INVALID_EMAIL")
        String email,

        @NotBlank(message = "REQUIRED_FIELD")
        @Size(min = 6, message = "PASSWORD_TOO_SHORT")
        String password
) {}