package com.cookquest.profile.dto;

import com.cookquest.profile.entity.DietaryPreferences;
import com.cookquest.profile.entity.Language;

public record UserProfileResponse(
        Long id,
        String username,
        int xp,
        int level,
        int balance,
        int ratingScore,
        Language language,
        Long activeMascotId,
        DietaryPreferences dietaryPreferences
) {}