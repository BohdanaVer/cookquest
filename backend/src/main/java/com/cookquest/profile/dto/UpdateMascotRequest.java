package com.cookquest.profile.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateMascotRequest(
        @NotBlank String activeMascot
) {}