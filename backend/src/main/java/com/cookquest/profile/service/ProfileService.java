package com.cookquest.profile.service;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.profile.dto.*;
import com.cookquest.profile.entity.UserProfile;
import com.cookquest.profile.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PROFILE_NOT_FOUND,
                        "Профіль користувача не знайдено",
                        HttpStatus.NOT_FOUND
                ));
        return mapToResponse(profile);
    }

    @Transactional
    public void updateLanguage(Long userId, UpdateLanguageRequest request) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PROFILE_NOT_FOUND,
                        "Профіль користувача не знайдено",
                        HttpStatus.NOT_FOUND
                ));
        profile.setLanguage(request.language());
        profileRepository.save(profile);
    }

    @Transactional
    public void updateMascot(Long userId, UpdateMascotRequest request) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PROFILE_NOT_FOUND,
                        "Профіль користувача не знайдено",
                        HttpStatus.NOT_FOUND
                ));
        profile.setActiveMascot(request.activeMascot());
        profileRepository.save(profile);
    }

    @Transactional
    public UserProfileResponse updatePreferences(Long userId, UpdatePreferencesRequest request) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PROFILE_NOT_FOUND,
                        "Профіль користувача не знайдено",
                        HttpStatus.NOT_FOUND
                ));

        var prefs = profile.getDietaryPreferences();
        prefs.setDiet(request.diet());
        prefs.setAllergens(request.allergens());
        prefs.setDislikes(request.dislikes());
        prefs.setCustomNote(request.customNote());

        profile.setDietaryPreferences(prefs);
        return mapToResponse(profileRepository.save(profile));
    }

    private UserProfileResponse mapToResponse(UserProfile p) {
        return new UserProfileResponse(
                p.getId(),
                p.getXp(),
                p.getLevel(),
                p.getBalance(),
                p.getRatingScore(),
                p.getLanguage(),
                p.getActiveMascot(),
                p.getDietaryPreferences()
        );
    }
}