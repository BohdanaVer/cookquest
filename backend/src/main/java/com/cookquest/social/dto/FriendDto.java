package com.cookquest.social.dto;

import java.time.LocalDateTime;

public record FriendDto(
        Long friendshipId,
        Long userId,
        String username,
        LocalDateTime friendSince
) {}
