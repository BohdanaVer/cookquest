package com.cookquest.cooking.integration.event;

public record CookingSessionCancelledEvent(Long sessionId, Long userId) {}
