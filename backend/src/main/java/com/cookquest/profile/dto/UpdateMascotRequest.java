package com.cookquest.profile.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateMascotRequest(
        @NotNull Long activeMascotId
) {}