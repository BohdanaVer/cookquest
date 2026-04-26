package com.cookquest.cooking.service;

import com.cookquest.auth.entity.CustomUserDetails;
import com.cookquest.auth.entity.User;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.cooking.ai.prompt.VerificationPromptBuilder;
import com.cookquest.cooking.ai.validator.VerificationValidator;
import com.cookquest.cooking.dto.CookingSessionDto;
import com.cookquest.cooking.dto.StartCookingRequest;
import com.cookquest.cooking.dto.StepVerificationResponse;
import com.cookquest.cooking.entity.CookingSession;
import com.cookquest.cooking.entity.SessionStatus;
import com.cookquest.cooking.repository.CookingSessionRepository;
import com.cookquest.profile.entity.Language;
import com.cookquest.profile.entity.UserProfile;
import com.cookquest.common.ai.GroqClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final RecipeSignatureService signatureService;

    // Твій ідеальний метод розпаковки Сейфа Спрінга
    private UserProfile getCurrentUserProfile() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User myUser = userDetails.getUser();
        return myUser.getProfile();
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userDetails.getUser();
    }

    @Transactional
    public CookingSessionDto startCooking(StartCookingRequest request) {
        signatureService.verifySignatureOrThrow(request.recipeJson(), request.signature());

        User user = getCurrentUser();
        CookingSession session = CookingSession.builder()
                .user(user)
                .recipeJson(request.recipeJson())
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
    public StepVerificationResponse verifyStep(Long sessionId, MultipartFile file, int stepNumber, String requestLanguage) {
        CookingSession session = getActiveSessionStrict(sessionId);
        UserProfile profile = getCurrentUserProfile();
        User currentUser = session.getUser(); // Дістаємо юзера для перевірки ролі

        // 1. Визначаємо мову для відповіді ШІ
        String targetLanguage = resolveLanguage(requestLanguage, profile);

        try {
            JsonNode recipeNode = objectMapper.readTree(session.getRecipeJson());
            String recipeName = recipeNode.path("name").asText();
            JsonNode stepsArray = recipeNode.path("steps");

            int basePoints = recipeNode.path("points").asInt(50);
            int totalSteps = stepsArray.size();

            // Фронтенд присилає stepNumber від 1. Індекс від 0.
            int stepIndex = stepNumber - 1;
            if (stepIndex < 0 || stepIndex >= totalSteps) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Неправильний номер кроку", HttpStatus.BAD_REQUEST);
            }

            JsonNode currentStep = stepsArray.get(stepIndex);
            String stepDesc = currentStep.path("text").asText();
            String checkpointLabel = currentStep.path("checkpointLabel").asText(null);

            VerificationValidator.StepVerificationResult result;

            // ==========================================
            // МАГІЯ ТЕСТУВАННЯ: РОЛЬ ADMIN
            // ==========================================
            // Перевіряємо, чи є користувач адміністратором
            boolean isAdmin = currentUser.getRole().name().equals("ADMIN");

            if (isAdmin) {
                log.info("Адміністратор перевіряє крок {}. Пропускаємо запит до ШІ.", stepNumber);
                // Імітуємо ідеальну відповідь від ШІ
                result = new VerificationValidator.StepVerificationResult(
                        100, true, "Ідеально виконано! (Auto-Approve by Admin)", true, true
                );
            } else {
                // ==========================================
                // РЕАЛЬНА ЛОГІКА ДЛЯ КОРИСТУВАЧІВ
                // ==========================================
                // Перевіряємо, чи передав звичайний користувач файл
                if (file == null || file.isEmpty()) {
                    throw new AppException(ErrorCode.INVALID_REQUEST, "Фотографія обов'язкова для перевірки!", HttpStatus.BAD_REQUEST);
                }

                // 2. Кодуємо фото
                String base64 = Base64.getEncoder().encodeToString(file.getBytes());
                String imageUrl = "data:" + file.getContentType() + ";base64," + base64;

                // 3. Будуємо промпт (передаємо мову!)
                String messagesPayload = promptBuilder.buildMessages(imageUrl, recipeName, stepNumber, stepDesc, checkpointLabel, targetLanguage);

                // 4. Запит до ШІ
                String rawResponse = groqClient.sendVisionRequestRaw(messagesPayload);
                JsonNode aiResponse = objectMapper.readTree(rawResponse);

                // 5. Валідація
                result = validator.validate(aiResponse);
                if (!result.valid()) {
                    throw new AppException(ErrorCode.AI_VISION_FAILED, "Не вдалося оцінити фото", HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }

            // 6. ЛОГІКА НАРАХУВАННЯ БАЛІВ
            if (result.passed()) {
                boolean isFinalStep = (stepNumber == totalSteps);
                String verifiedStr = session.getVerifiedSteps();

                // ШЛЯХ А: Це ПРОМІЖНИЙ крок
                if (!isFinalStep) {
                    // Якщо ми ще НЕ давали бали за цей крок
                    if (!verifiedStr.contains(String.valueOf(stepNumber))) {
                        session.setVerifiedSteps(verifiedStr.isEmpty() ? String.valueOf(stepNumber) : verifiedStr + "," + stepNumber);

                        // Даємо +15 бонусних балів (+20, якщо ШІ в захваті)
                        int bonus = result.bonusEligible() ? 20 : 15;
                        session.setEarnedPoints(session.getEarnedPoints() + bonus);
                    }
                }
                // ШЛЯХ Б: Це ФІНАЛЬНИЙ крок (Готова страва)
                else {
                    session.setStatus(SessionStatus.COMPLETED);
                    session.setCompletedAt(LocalDateTime.now());

                    // Нараховуємо: Базові бали + Всі накопичені бонуси
                    int totalXpToAward = basePoints + session.getEarnedPoints();

                    profile.setXp(profile.getXp() + totalXpToAward);
                    profile.setRatingScore(profile.getRatingScore() + totalXpToAward);
                    profile.setBalance(profile.getBalance() + totalXpToAward);
                }
            }

            return StepVerificationResponse.builder()
                    .score(result.score())
                    .passed(result.passed())
                    .feedback(result.feedback())
                    .bonusEligible(result.bonusEligible())
                    .sessionStatus(session.getStatus().name())
                    .build();

        } catch (AppException e) {
            // Прокидаємо наші власні помилки без змін
            throw e;
        } catch (Exception e) {
            log.error("Step verification error", e);
            throw new AppException(ErrorCode.AI_VISION_FAILED, "Помилка перевірки ШІ", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private CookingSession getActiveSessionStrict(Long sessionId) {
        CookingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Сесію не знайдено", HttpStatus.NOT_FOUND));
        if (!session.getUser().getId().equals(getCurrentUser().getId())) {
            throw new AppException(ErrorCode.SECURITY_VIOLATION, "Це не ваша сесія", HttpStatus.FORBIDDEN);
        }
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Сесія не активна", HttpStatus.BAD_REQUEST);
        }
        return session;
    }

    private CookingSessionDto mapToDto(CookingSession session) {
        return CookingSessionDto.builder()
                .sessionId(session.getId())
                .recipeJson(session.getRecipeJson())
                .status(session.getStatus().name())
                .earnedPoints(session.getEarnedPoints())
                .startedAt(session.getStartedAt())
                .build();
    }

    // Визначаємо мову для ШІ
    private String resolveLanguage(String requestLang, UserProfile profile) {
        if (requestLang != null && !requestLang.isBlank()) {
            String lang = requestLang.trim().toLowerCase();
            return switch (lang) {
                case "uk" -> "Ukrainian";
                case "en" -> "English";
                default -> throw new AppException(
                        ErrorCode.INVALID_REQUEST,
                        "Непідтримувана мова: '" + requestLang + "'. Доступні варіанти: 'uk', 'en'.",
                        HttpStatus.BAD_REQUEST
                );
            };
        }
        if (profile != null && profile.getLanguage() != null) {
            return profile.getLanguage() == Language.UK ? "Ukrainian" : "English";
        }
        return "English";
    }
}