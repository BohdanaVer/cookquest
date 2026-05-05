package com.cookquest.cooking.service;

import com.cookquest.auth.entity.CustomUserDetails;
import com.cookquest.auth.entity.User;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.cooking.ai.prompt.VerificationPromptBuilder;
import com.cookquest.cooking.ai.validator.VerificationValidator;
import com.cookquest.cooking.dto.CookingSessionDto;
import com.cookquest.cooking.integration.RecipeCookingData;
import com.cookquest.cooking.dto.StartCookingRequest;
import com.cookquest.cooking.dto.StepVerificationResponse;
import com.cookquest.cooking.entity.*;
import com.cookquest.cooking.integration.RecipeIntegrationService;
import com.cookquest.cooking.repository.CookingSessionRepository;
import com.cookquest.cooking.repository.UsedBatchRepository;
import com.cookquest.profile.entity.Language;
import com.cookquest.profile.entity.UserProfile;
import com.cookquest.profile.service.ProfileService;
import com.cookquest.common.ai.GroqClient;
import com.cookquest.cooking.integration.event.CookingSessionCompletedEvent;
import com.cookquest.quest.service.QuestService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CookingService {

    private final CookingSessionRepository sessionRepository;
    private final GroqClient groqClient;
    private final ObjectMapper objectMapper;
    private final VerificationPromptBuilder promptBuilder;
    private final VerificationValidator validator;
    private final UsedBatchRepository usedBatchRepository;
    private final QuestService questIntegrationService;
    private final CookingRewardService cookingRewardService;
    private final RecipeIntegrationService recipeIntegrationService;
    private final ProfileService profileService;
    private final ApplicationEventPublisher eventPublisher;

    
    private UserProfile getCurrentUserProfile() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        return userDetails.getUser().getProfile();
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        return userDetails.getUser();
    }

    @Transactional
    public CookingSessionDto startCooking(StartCookingRequest request) {
        User user = getCurrentUser();

        var existingSession = sessionRepository.findFirstByUserIdAndRecipeIdAndStatus(
                user.getId(), request.recipeId(), SessionStatus.IN_PROGRESS);

        if (existingSession.isPresent()) {
            return mapToDto(existingSession.get());
        }

        RecipeCookingData recipe = recipeIntegrationService.getRecipeData(request.recipeId());

        if (!recipe.isUnlocked()) {
            recipeIntegrationService.unlockRecipe(recipe.id());
        }

        boolean isQuestActive = questIntegrationService.isQuestActiveToday(recipe.id());

        XpMode xpMode = cookingRewardService.determineMode(user.getId(), recipe);

        if (xpMode == XpMode.FULL && !isQuestActive && recipe.batchId() != null) {
            try {
                usedBatchRepository.save(
                        UsedBatch.builder()
                                .user(user)
                                .batchId(recipe.batchId())
                                .usedAt(LocalDateTime.now())
                                .build());
            } catch (DataIntegrityViolationException e) {
                log.warn("Батч {} вже використано юзером {}", recipe.batchId(), user.getId());
                throw new AppException(
                        ErrorCode.INVALID_REQUEST,
                        "Ви вже почали готувати рецепт з цієї генерації",
                        HttpStatus.BAD_REQUEST);
            }
        }

        CookingSession session = CookingSession.builder()
                .user(user)
                .recipeId(recipe.id())
                .batchId(recipe.batchId())
                .recipeJson(recipe.recipeJson())
                .xpMode(xpMode)
                .status(SessionStatus.IN_PROGRESS)
                .verifiedSteps("")
                .earnedPoints(0)
                .startedAt(LocalDateTime.now())
                .build();

        return mapToDto(sessionRepository.save(session));
    }

    @Transactional
    public void cancelCooking(Long sessionId) {
        CookingSession session = getActiveSessionStrict(sessionId);
        session.setStatus(SessionStatus.CANCELLED);
        sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public List<CookingSessionDto> getActiveSessions() {
        return sessionRepository.findAllByUserAndStatus(getCurrentUser(), SessionStatus.IN_PROGRESS)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public StepVerificationResponse verifyStep(Long sessionId, MultipartFile file, int stepNumber,
            String requestLanguage) {
        CookingSession session = getActiveSessionStrict(sessionId);

        if (session.getXpMode() == XpMode.NONE) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Цей рецепт відкрито у режимі перегляду. Перевірка кроків для нього недоступна.",
                    HttpStatus.BAD_REQUEST);
        }

        UserProfile profile = getCurrentUserProfile();
        User currentUser = session.getUser();
        String targetLanguage = resolveLanguage(requestLanguage, profile);

        try {
            JsonNode recipeNode = objectMapper.readTree(session.getRecipeJson());
            int totalSteps = recipeNode.path("steps").size();
            boolean isFinalStep = (stepNumber == totalSteps);

            validateStepRequest(session, file, stepNumber, totalSteps, isFinalStep);

            JsonNode currentStep = recipeNode.path("steps").get(stepNumber - 1);
            VerificationValidator.StepVerificationResult result = performVerification(
                    session, currentUser, file, recipeNode.path("name").asText(),
                    stepNumber, currentStep, isFinalStep, targetLanguage);

            int earnedPointsForStep = 0;
            if (result.passed()) {
                if (isFinalStep) {
                    int basePoints = recipeNode.path("points").asInt(50);
                    earnedPointsForStep = processFinalStep(session, currentUser, profile, basePoints);
                } else {
                    earnedPointsForStep = processIntermediateStep(session, stepNumber, result);
                }
            }

            return StepVerificationResponse.builder()
                    .score(result.score())
                    .passed(result.passed())
                    .feedback(result.feedback())
                    .bonusEligible(result.bonusEligible())
                    .sessionStatus(session.getStatus().name())
                    .currentStepIndex(stepNumber)
                    .earnedPointsForStep(earnedPointsForStep)
                    .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Step verification error", e);
            throw new AppException(ErrorCode.AI_VISION_FAILED, "Помилка перевірки ШІ",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void validateStepRequest(CookingSession session, MultipartFile file, int stepNumber, int totalSteps,
            boolean isFinalStep) {
        int stepIndex = stepNumber - 1;
        if (stepIndex < 0 || stepIndex >= totalSteps) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Неправильний номер кроку", HttpStatus.BAD_REQUEST);
        }

        if (file != null && !file.isEmpty()) {
            if (session.getXpMode() == XpMode.REDUCED && !isFinalStep) {
                throw new AppException(ErrorCode.INVALID_REQUEST,
                        "У цьому режимі фото приймається ЛИШЕ на фінальному кроці.", HttpStatus.BAD_REQUEST);
            }
        }

        String[] verified = session.getVerifiedSteps().split(",");
        if (java.util.Arrays.asList(verified).contains(String.valueOf(stepNumber))) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Цей крок вже оцінено", HttpStatus.BAD_REQUEST);
        }
    }

    private VerificationValidator.StepVerificationResult performVerification(
            CookingSession session, User currentUser, MultipartFile file,
            String recipeName, int stepNumber, JsonNode currentStep,
            boolean isFinalStep, String targetLanguage) throws Exception {

        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");

        if (isAdmin) {
            log.info("Адміністратор перевіряє крок {}. Пропускаємо запит до ШІ.", stepNumber);
            return new VerificationValidator.StepVerificationResult(100, true,
                    "Ідеально виконано! (Auto-Approve by Admin)", true, true);
        }

        if (session.getXpMode() == XpMode.NONE) {
            return new VerificationValidator.StepVerificationResult(100, true, "Крок пройдено! (Вільне готування)",
                    false, true);
        }
        if (session.getXpMode() == XpMode.REDUCED && !isFinalStep) {
            return new VerificationValidator.StepVerificationResult(100, true,
                    "Крок пройдено! (ШІ оцінить фінальну страву)", false, true);
        }

        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Фото обов'язкове!", HttpStatus.BAD_REQUEST);
        }

        String stepDesc = currentStep.path("text").asText();
        String checkpointLabel = currentStep.path("checkpointLabel").asText(null);
        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        String imageUrl = "data:" + file.getContentType() + ";base64," + base64;

        String messagesPayload = promptBuilder.buildMessages(imageUrl, recipeName, stepNumber, stepDesc,
                checkpointLabel, targetLanguage);
        String rawResponse = groqClient.sendVisionRequestRaw(messagesPayload);

        return validator.validate(objectMapper.readTree(rawResponse));
    }

    private int processIntermediateStep(CookingSession session, int stepNumber,
            VerificationValidator.StepVerificationResult result) {
        String verifiedStr = session.getVerifiedSteps();

        if (!verifiedStr.contains(String.valueOf(stepNumber))) {
            session.setVerifiedSteps(
                    verifiedStr.isEmpty() ? String.valueOf(stepNumber) : verifiedStr + "," + stepNumber);

            if (session.getXpMode() == XpMode.FULL) {
                int bonus = result.bonusEligible() ? 20 : 15;
                session.setEarnedPoints(session.getEarnedPoints() + bonus);
                return bonus;
            }
        }
        return 0;
    }

    private int processFinalStep(CookingSession session, User currentUser, UserProfile profile, int basePoints) {
        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());

        int totalXpToAward = 0;

        if (session.getXpMode() == XpMode.FULL) {
            double currentMultiplier = 1.0;
            boolean downgradeToReduced = false;

            if (questIntegrationService.isQuestActiveToday(session.getRecipeId())) {
                boolean alreadyCompleted = questIntegrationService.isQuestCompletedByUser(currentUser.getId(),
                        session.getRecipeId());

                if (!alreadyCompleted) {
                    currentMultiplier = questIntegrationService.getQuestMultiplier(session.getRecipeId());
                    questIntegrationService.markQuestCompleted(currentUser.getId(), session.getRecipeId(),
                            session.getStartedAt());
                } else {
                    downgradeToReduced = true;
                }
            }

            if (downgradeToReduced) {
                totalXpToAward = Math.max(1, basePoints / 10);
            } else {
                int questBasePoints = (int) (basePoints * currentMultiplier);
                totalXpToAward = questBasePoints + session.getEarnedPoints();
            }

        } else if (session.getXpMode() == XpMode.REDUCED) {
            totalXpToAward = Math.max(1, basePoints / 10);
        } else if (session.getXpMode() == XpMode.BATTLE) {
            totalXpToAward = 0;
        }

        if (totalXpToAward > 0) {
            profileService.awardCookingRewards(currentUser.getId(), totalXpToAward);
        }


        eventPublisher.publishEvent(new CookingSessionCompletedEvent(session.getId(), currentUser.getId()));

        return totalXpToAward;
    }

    private CookingSession getActiveSessionStrict(Long sessionId) {
        CookingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(
                        () -> new AppException(ErrorCode.INVALID_REQUEST, "Сесію не знайдено", HttpStatus.NOT_FOUND));

        User currentUser = getCurrentUser();
        boolean isOwner = session.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");

        if (!isOwner && !isAdmin) {
            throw new AppException(ErrorCode.SECURITY_VIOLATION, "Відмовлено в доступі. Це не ваша сесія.",
                    HttpStatus.FORBIDDEN);
        }

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Сесія не активна", HttpStatus.BAD_REQUEST);
        }

        return session;
    }

    private CookingSessionDto mapToDto(CookingSession session) {
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
            log.error("Помилка десеріалізації рецепта для DTO", e);
            throw new AppException(
                    ErrorCode.INTERNAL_SERVER_ERROR,
                    "Помилка обробки даних рецепта",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String resolveLanguage(String requestLang, UserProfile profile) {
        if (requestLang != null && !requestLang.isBlank()) {
            String lang = requestLang.trim().toLowerCase();
            return switch (lang) {
                case "uk" -> "Ukrainian";
                case "en" -> "English";
                default -> throw new AppException(
                        ErrorCode.INVALID_REQUEST,
                        "Непідтримувана мова: '" + requestLang + "'. Доступні варіанти: 'uk', 'en'.",
                        HttpStatus.BAD_REQUEST);
            };
        }
        if (profile != null && profile.getLanguage() != null) {
            return profile.getLanguage() == Language.UK ? "Ukrainian" : "English";
        }
        return "English";
    }
}