package com.cookquest.profile.dto;

public record LeaderboardDto(
        int rank,
        String username,
        int xp,
        int levelNumber,
        String levelName,
        String mascotImageUrl
) {}