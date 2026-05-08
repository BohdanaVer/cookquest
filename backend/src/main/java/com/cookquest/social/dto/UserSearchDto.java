package com.cookquest.social.dto;

public record UserSearchDto(
        Long userId,
        String username,
        Integer levelNumber,
        String mascotImageUrl
) {}