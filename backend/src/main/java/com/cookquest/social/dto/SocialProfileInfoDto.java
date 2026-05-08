package com.cookquest.social.dto;

public record SocialProfileInfoDto(
        Long userId,
        String username,
        Integer levelNumber,
        String mascotImageUrl
) {}