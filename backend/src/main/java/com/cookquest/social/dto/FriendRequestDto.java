package com.cookquest.social.dto;

import java.time.LocalDateTime;

public record FriendRequestDto(
        Long friendshipId,
        String requesterUsername,
        LocalDateTime createdAt
) {}