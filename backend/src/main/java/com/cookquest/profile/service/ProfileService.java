package com.cookquest.profile.service;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.profile.dto.*;
import com.cookquest.profile.entity.Level;
import com.cookquest.profile.entity.UserProfile;
import com.cookquest.profile.repository.LevelRepository;
import com.cookquest.profile.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserProfileRepository profileRepository;
    private final LevelRepository levelRepository;

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
        profile.setActiveMascotId(request.activeMascotId());
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

    @Transactional
    public void awardCookingRewards(Long userId, int amount) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PROFILE_NOT_FOUND,
                        "Профіль користувача не знайдено",
                        HttpStatus.NOT_FOUND
                ));

        profile.setXp(profile.getXp() + amount);
        profile.setRatingScore(profile.getRatingScore() + amount);
        
        checkLevelUp(profile);

        profileRepository.save(profile);
    }

    @Transactional
    public void awardBattleRewards(Long userId, int xpAmount, int coinsAmount) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PROFILE_NOT_FOUND,
                        "Профіль користувача не знайдено",
                        HttpStatus.NOT_FOUND
                ));

        profile.setXp(profile.getXp() + xpAmount);
        profile.setRatingScore(profile.getRatingScore() + xpAmount);
        profile.setBalance(profile.getBalance() + coinsAmount);

        checkLevelUp(profile);

        profileRepository.save(profile);
    }

    private void checkLevelUp(UserProfile profile) {
        Level targetLevel = levelRepository.findFirstByRequiredXpLessThanEqualOrderByRequiredXpDesc(profile.getXp())
                .orElseThrow(() -> new RuntimeException("Системна помилка: рівні не налаштовані в БД"));

        if (profile.getLevel() == null || !profile.getLevel().getId().equals(targetLevel.getId())) {
            profile.setLevel(targetLevel);

            int reward = targetLevel.getRewardCoins() != null ? targetLevel.getRewardCoins() : 0;
            profile.setBalance(profile.getBalance() + reward);

            log.info("Профіль ID {} отримав новий рівень: {} ({}). Нагорода: {} монет",
                    profile.getId(), targetLevel.getLevelNumber(), targetLevel.getName(), reward);
        }
    }

    private UserProfileResponse mapToResponse(UserProfile p) {
        return new UserProfileResponse(
                p.getId(),
                p.getUser().getUsername(),
                p.getXp(),
                p.getLevel() != null ? p.getLevel().getLevelNumber() : 1,
                p.getLevel() != null ? p.getLevel().getName() : "Новачок",
                p.getBalance(),
                p.getRatingScore(),
                p.getLanguage(),
                p.getActiveMascotId(),
                p.getDietaryPreferences()
        );
    }

    @Transactional(readOnly = true)
    public List<LeaderboardDto> getLeaderboard() {
        List<UserProfile> topProfiles = profileRepository.findTopProfilesByXp(PageRequest.of(0, 10));
        List<LeaderboardDto> leaderboard = new ArrayList<>();

        for (int i = 0; i < topProfiles.size(); i++) {
            UserProfile p = topProfiles.get(i);
            leaderboard.add(new LeaderboardDto(
                    i + 1,
                    p.getUser().getUsername(),
                    p.getXp(),
                    p.getLevel() != null ? p.getLevel().getLevelNumber() : 1,
                    p.getLevel() != null ? p.getLevel().getName() : "Новачок",
                    p.getActiveMascotId()
            ));
        }
        return leaderboard;
    }
}