package com.cookquest.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "REQUIRED_FIELD")
    @Email(message = "INVALID_EMAIL")
    private String email;

    @NotBlank(message = "REQUIRED_FIELD")
    private String password;
}