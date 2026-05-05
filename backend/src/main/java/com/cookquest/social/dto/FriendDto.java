package com.cookquest.social.dto;

import java.time.LocalDateTime;

public record FriendDto(
        Long friendshipId,
        String username,
        LocalDateTime friendSince
) {}