package com.cookquest.social.integration;

public interface ProfileSocialApi {
    Long getUserIdByUsername(String username);
    String getUsernameById(Long userId);
}
