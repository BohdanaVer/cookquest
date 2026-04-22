package com.cookquest.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "REQUIRED_FIELD")
    @Size(min = 2, max = 50, message = "INVALID_LENGTH_2_50")
    private String username;

    @NotBlank(message = "REQUIRED_FIELD")
    @Email(message = "INVALID_EMAIL")
    private String email;

    @NotBlank(message = "REQUIRED_FIELD")
    @Size(min = 6, message = "PASSWORD_TOO_SHORT")
    private String password;
}