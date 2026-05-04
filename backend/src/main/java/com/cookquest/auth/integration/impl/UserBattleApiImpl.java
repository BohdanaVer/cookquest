package com.cookquest.auth.integration.impl;

import com.cookquest.auth.entity.User;
import com.cookquest.auth.repository.UserRepository;
import com.cookquest.battle.integration.UserBattleApi;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserBattleApiImpl implements UserBattleApi {

    private final UserRepository userRepository;

    @Override
    public Long getUserIdByUsername(String username) {
        try {
            Optional<User> userOptional = userRepository.findByUsername(username);
            return userOptional.map(User::getId).orElse(null);
        } catch (IncorrectResultSizeDataAccessException e) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    "Існує декілька акаунтів з іменем '" + username + "'. Це стара системна помилка. Будь ласка, зверніться до підтримки.",
                    HttpStatus.CONFLICT
            );
        }
    }

    @Override
    public String getUsernameById(Long userId) {
        return userRepository.findById(userId)
                .map(User::getUsername)
                .orElse(null);
    }
}
