package com.cookquest.cooking.service;

import com.cookquest.cooking.integration.RecipeCookingData;
import com.cookquest.cooking.entity.XpMode;
import com.cookquest.cooking.repository.CookingSessionRepository;
import com.cookquest.cooking.repository.UsedBatchRepository;
import com.cookquest.recipe.integration.CookingRewardIntegrationService;
import com.cookquest.quest.service.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CookingRewardService implements CookingRewardIntegrationService {

    private final QuestService questIntegrationService;
    private final UsedBatchRepository usedBatchRepository;
    private final CookingSessionRepository sessionRepository;

    public XpMode determineMode(Long userId, RecipeCookingData recipe) {
        if (questIntegrationService.isQuestActiveToday(recipe.id())) {
            boolean questDone = questIntegrationService.isQuestCompletedByUser(userId, recipe.id());
            if (!questDone) return XpMode.FULL;
        } else {
            boolean isAuthor = recipe.authorId() != null && recipe.authorId().equals(userId);
            if (isAuthor) {
                if (recipe.batchId() == null) return XpMode.FULL;
                if (!usedBatchRepository.existsByUserIdAndBatchId(userId, recipe.batchId())) {
                    return XpMode.FULL;
                }
            }
        }

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long reducedCooksToday = sessionRepository.countByUserIdAndXpModeAndStartedAtAfter(
                userId, XpMode.REDUCED, startOfDay
        );
        return (reducedCooksToday >= 1) ? XpMode.NONE : XpMode.REDUCED;
    }

    public int calculatePotentialPoints(Long userId, String recipeId, String batchId, Long authorId, int basePoints) {
        RecipeCookingData dummyData = new RecipeCookingData(recipeId, authorId, batchId, null, false);
        XpMode expectedMode = determineMode(userId, dummyData);

        if (expectedMode == XpMode.NONE) return 0;
        if (expectedMode == XpMode.REDUCED) return Math.max(1, basePoints / 10);

        if (questIntegrationService.isQuestActiveToday(recipeId)) {
            Double multiplier = questIntegrationService.getQuestMultiplier(recipeId);
            return (int) (basePoints * multiplier);
        }
        return basePoints;
    }
}
