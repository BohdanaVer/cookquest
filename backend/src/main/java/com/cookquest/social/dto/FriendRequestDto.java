package com.cookquest.social.dto;

import java.time.LocalDateTime;

public record FriendRequestDto(
        Long friendshipId,
        Long requesterId,
        String requesterUsername,
        LocalDateTime createdAt
) {}
