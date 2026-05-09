package com.cookquest.cooking.integration.impl;

import com.cookquest.auth.entity.User;
import com.cookquest.battle.integration.CookingBattleApi;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.cooking.dto.CookingSessionDto;
import com.cookquest.cooking.entity.CookingSession;
import com.cookquest.cooking.entity.SessionStatus;
import com.cookquest.cooking.entity.UsedBatch;
import com.cookquest.cooking.entity.XpMode;
import com.cookquest.cooking.integration.RecipeCookingData;
import com.cookquest.cooking.integration.RecipeIntegrationService;
import com.cookquest.cooking.repository.CookingSessionRepository;
import com.cookquest.cooking.repository.UsedBatchRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CookingBattleApiImpl implements CookingBattleApi {

    private final CookingSessionRepository sessionRepository;
    private final UsedBatchRepository usedBatchRepository;
    private final RecipeIntegrationService recipeIntegrationService;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    @Transactional
    @Override
    public void burnBatch(Long userId, String recipeId) {
        User user = entityManager.getReference(User.class, userId);
        RecipeCookingData recipe = recipeIntegrationService.getRecipeData(recipeId);
        if (recipe.batchId() != null) {
            usedBatchRepository.save(
                    UsedBatch.builder()
                            .user(user)
                            .batchId(recipe.batchId())
                            .usedAt(LocalDateTime.now())
                            .build()
            );
        }
    }

    @Transactional
    @Override
    public Long startBattleCookingSession(Long userId, String recipeId) {
        User user = entityManager.getReference(User.class, userId);
        RecipeCookingData recipe = recipeIntegrationService.getRecipeData(recipeId);

        if (recipe.batchId() != null) {
            usedBatchRepository.save(
                    UsedBatch.builder()
                            .user(user)
                            .batchId(recipe.batchId())
                            .usedAt(LocalDateTime.now())
                            .build()
            );
        }

        CookingSession session = CookingSession.builder()
                .user(user)
                .recipeId(recipe.id())
                .batchId(recipe.batchId())
                .recipeJson(recipe.recipeJson())
                .xpMode(XpMode.BATTLE)
                .status(SessionStatus.IN_PROGRESS)
                .verifiedSteps("")
                .earnedPoints(0)
                .startedAt(LocalDateTime.now())
                .build();

        return sessionRepository.save(session).getId();
    }

    @Override
    public boolean isSessionCancelled(Long sessionId) {
        if (sessionId == null) return true;
        return sessionRepository.findById(sessionId)
                .map(s -> s.getStatus() == SessionStatus.CANCELLED)
                .orElse(true); // відсутня сесія = скасована
    }

    @Override
    public boolean sessionExists(Long sessionId) {
        if (sessionId == null) return false;
        return sessionRepository.existsById(sessionId);
    }

    @Override
    public int getAiQualityScore(Long sessionId) {
        CookingSession session = sessionRepository.findById(sessionId).orElseThrow();
        if (session.getStatus() == SessionStatus.COMPLETED) {
            return 100; 
        }
        return 0;
    }

    @Override
    public int getCookingTimeSpentMinutes(Long sessionId) {
        CookingSession session = sessionRepository.findById(sessionId).orElseThrow();
        LocalDateTime end = session.getCompletedAt() != null ? session.getCompletedAt() : LocalDateTime.now();
        return (int) Duration.between(session.getStartedAt(), end).toMinutes();
    }

    @Override
    public CookingSessionDto getSessionDetails(Long sessionId) {
        CookingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Сесію не знайдено", HttpStatus.NOT_FOUND));
        try {
            return CookingSessionDto.builder()
                    .sessionId(session.getId())
                    .recipe(objectMapper.readValue(session.getRecipeJson(), Object.class))
                    .status(session.getStatus().name())
                    .earnedPoints(session.getEarnedPoints())
                    .startedAt(session.getStartedAt())
                    .xpMode(session.getXpMode())
                    .batchId(session.getBatchId())
                    .build();
        } catch (Exception e) {
            log.error("Помилка десеріалізації рецепта для DTO сесії {}", sessionId, e);
            throw new AppException(
                    ErrorCode.INTERNAL_SERVER_ERROR,
                    "Помилка обробки даних рецепта",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public boolean isRecipeAlreadyUsed(Long userId, String recipeId) {
        RecipeCookingData recipe = recipeIntegrationService.getRecipeData(recipeId);
        if (recipe.batchId() == null) {
            return false;
        }
        return usedBatchRepository.existsByUserIdAndBatchId(userId, recipe.batchId());
    }

    @Transactional
    @Override
    public void cancelSession(Long sessionId) {
        if (sessionId == null) return;
        sessionRepository.findById(sessionId).ifPresent(session -> {
            if (session.getStatus() == SessionStatus.IN_PROGRESS) {
                session.setStatus(SessionStatus.CANCELLED);
                sessionRepository.save(session);
            }
        });
    }
}

