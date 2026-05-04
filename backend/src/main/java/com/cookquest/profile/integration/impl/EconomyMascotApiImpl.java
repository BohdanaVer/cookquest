package com.cookquest.profile.integration.impl;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.mascot.integration.EconomyMascotApi;
import com.cookquest.profile.entity.UserProfile;
import com.cookquest.profile.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EconomyMascotApiImpl implements EconomyMascotApi {

    private final UserProfileRepository profileRepository;

    @Override
    @Transactional(readOnly = true)
    public boolean hasEnoughCoins(Long userId, int amount) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PROFILE_NOT_FOUND,
                        "Профіль користувача не знайдено",
                        HttpStatus.NOT_FOUND
                ));
        return profile.getBalance() >= amount;
    }

    @Override
    @Transactional
    public void deductCoins(Long userId, int amount) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCode.PROFILE_NOT_FOUND,
                        "Профіль користувача не знайдено",
                        HttpStatus.NOT_FOUND
                ));

        if (profile.getBalance() < amount) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    "Недостатньо монет",
                    HttpStatus.BAD_REQUEST
            );
        }

        profile.setBalance(profile.getBalance() - amount);
        profileRepository.save(profile);
    }
}
