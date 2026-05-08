package com.cookquest.profile.dto;

import com.cookquest.profile.entity.DietaryPreferences;
import com.cookquest.profile.entity.Language;

public record UserProfileResponse(
        Long id,
        String username,
        int xp,
        int levelNumber,
        String levelName,
        int currentLevelXp, // НОВЕ ПОЛЕ
        int nextLevelXp,    // НОВЕ ПОЛЕ
        int balance,
        int ratingScore,
        Language language,
        String activeMascotImageUrlHappy,
        String activeMascotImageUrlNeutral,
        String activeMascotImageUrlSad,
        DietaryPreferences dietaryPreferences
) {}