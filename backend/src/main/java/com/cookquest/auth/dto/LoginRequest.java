package com.cookquest.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "REQUIRED_FIELD")
        @Email(message = "INVALID_EMAIL")
        String email,

        @NotBlank(message = "REQUIRED_FIELD")
        String password
) {}