package com.cookquest.profile.integration.impl;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.mascot.integration.ProfileMascotApi;
import com.cookquest.profile.entity.UserProfile;
import com.cookquest.profile.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileMascotApiImpl implements ProfileMascotApi {

    private final UserProfileRepository profileRepository;

    @Override
    @Transactional
    public void updateActiveMascot(Long userId, Long mascotId) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PROFILE_NOT_FOUND,
                        "Профіль користувача не знайдено",
                        HttpStatus.NOT_FOUND
                ));
        profile.setActiveMascotId(mascotId);
        profileRepository.save(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getActiveMascot(Long userId) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PROFILE_NOT_FOUND,
                        "Профіль користувача не знайдено",
                        HttpStatus.NOT_FOUND
                ));
        return profile.getActiveMascotId();
    }
}
