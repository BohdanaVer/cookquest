package com.cookquest.profile.dto;

import com.cookquest.profile.entity.Language;
import jakarta.validation.constraints.NotNull;

public record UpdateLanguageRequest(
        @NotNull Language language
) {}