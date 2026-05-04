package com.cookquest.mascot.integration;

public interface ProfileMascotApi {
    void updateActiveMascot(Long userId, Long mascotId);
    Long getActiveMascot(Long userId);
}
