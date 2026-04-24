package com.cookquest.profile.dto;

import java.util.List;

public record UpdatePreferencesRequest(
        String diet,
        List<String> allergens,
        List<String> dislikes,
        String customNote
) {}