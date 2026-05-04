package com.cookquest.cooking.integration.event;

public record CookingSessionCompletedEvent(
        Long sessionId,
        Long userId
) {}
