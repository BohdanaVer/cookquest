package com.cookquest.social.integration;


import com.cookquest.social.dto.SocialProfileInfoDto;
import com.cookquest.social.dto.UserSearchDto;
import java.util.List;

public interface ProfileSocialApi {
    Long getUserIdByUsername(String username);
    String getUsernameById(Long userId); // Якщо ще десь використовуєш

    SocialProfileInfoDto getSocialProfileInfo(Long userId);
    List<UserSearchDto> searchUsers(String query, Long currentUserId);
    List<UserSearchDto> getRandomSuggestions(int limit, List<Long> excludedUserIds);
}
