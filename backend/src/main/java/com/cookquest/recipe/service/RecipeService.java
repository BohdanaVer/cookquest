package com.cookquest.recipe.service;

import com.cookquest.auth.entity.CustomUserDetails;
import com.cookquest.auth.entity.User;
import com.cookquest.common.exception.AppException;
import com.cookquest.cooking.service.RecipeSignatureService;
import com.cookquest.profile.entity.Language;
import com.cookquest.profile.entity.UserProfile;
import com.cookquest.common.ai.GroqClient;
import com.cookquest.recipe.ai.prompt.RecipePromptBuilder;
import com.cookquest.recipe.ai.prompt.VisionPromptBuilder;
import com.cookquest.recipe.ai.validator.InputSanitizer;
import com.cookquest.recipe.ai.validator.OutputValidator;
import com.cookquest.recipe.dto.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cookquest.common.exception.ErrorCode;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecipeService {

    private final InputSanitizer inputSanitizer;
    private final OutputValidator outputValidator;
    private final RecipePromptBuilder recipePromptBuilder;
    private final VisionPromptBuilder visionPromptBuilder;
    private final GroqClient groqClient;
    private final ObjectMapper objectMapper;
    private final RecipeSignatureService signatureService;

    private final Random random = new Random();
    private static final String[] DIFFICULTY_LEVELS = {"easy", "medium", "hard"};


    public RecipeListResponse generateRecipes(GenerateRecipeRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User myUser = userDetails.getUser();
        UserProfile profile = myUser.getProfile();

        String targetLanguage = resolveLanguage(request.requestLanguage(), profile);
        String randomFourthDifficulty = DIFFICULTY_LEVELS[random.nextInt(DIFFICULTY_LEVELS.length)];

        List<String> safeIngredients = null;
        if (request.ingredients() != null && !request.ingredients().isEmpty()) {
            safeIngredients = inputSanitizer.sanitizeIngredientList(request.ingredients());
        }

        String safeTextQuery = null;
        if (request.textQuery() != null && !request.textQuery().isBlank()) {
            InputSanitizer.SanitizeResult result = inputSanitizer.sanitizeUserComment(request.textQuery());
            if (!result.safe()) {
                throw new AppException(
                        ErrorCode.SECURITY_VIOLATION,
                        result.message(),
                        HttpStatus.BAD_REQUEST);
            }
            safeTextQuery = result.sanitized();
        }

        if ((safeIngredients == null || safeIngredients.isEmpty()) && safeTextQuery == null) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    "Будь ласка, введіть запит або додайте інгредієнти.",
                    HttpStatus.BAD_REQUEST);
        }

        String messagesPayload = recipePromptBuilder.buildUnifiedRecipeMessages(
                safeIngredients, safeTextQuery, null, profile, targetLanguage, randomFourthDifficulty
        );

        String rawJson = groqClient.sendTextRequest(messagesPayload);

        try {
            JsonNode rootNode = objectMapper.readTree(rawJson);

            List<JsonNode> validatedNodes = outputValidator.validateRecipeList(rootNode);

            if (validatedNodes.isEmpty()) {
                log.error("AI returned invalid recipes. Raw response: {}", rawJson);
                throw new AppException(
                        ErrorCode.AI_GENERATION_FAILED,
                        "ШІ не зміг створити валідні рецепти. Можливо, запит був некоректним. Будь ласка, спробуйте ще раз.",
                        HttpStatus.SERVICE_UNAVAILABLE);
            }

            List<RecipeItem> safeRecipes = new ArrayList<>();
            for (JsonNode node : validatedNodes) {
                String recipeContent = objectMapper.writeValueAsString(node);
                String signature = signatureService.generateSignature(recipeContent);

                Map<String, Object> recipeMap = objectMapper.convertValue(node, new TypeReference<>() {});
                recipeMap.put("signature", signature);

                RecipeItem item = objectMapper.convertValue(recipeMap, RecipeItem.class);
                safeRecipes.add(item);
            }

            return new RecipeListResponse(safeRecipes);

        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", rawJson, e);
            throw new AppException(
                    ErrorCode.AI_GENERATION_FAILED,
                    "Помилка обробки рецептів від ШІ",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public VisionResponse recognizeIngredients(List<MultipartFile> files, String requestLanguage) {
        if (files == null || files.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Фотографії не передані", HttpStatus.BAD_REQUEST);
        }
        if (files.size() > 3) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Можна завантажити максимум 3 фотографії", HttpStatus.BAD_REQUEST);
        }

        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User myUser = userDetails.getUser();
        UserProfile profile = myUser.getProfile();

        String targetLanguage = resolveLanguage(requestLanguage, profile);


        try {
            List<String> imageUrls = new ArrayList<>();

            for (MultipartFile file : files) {
                byte[] bytes = file.getBytes();
                String base64 = Base64.getEncoder().encodeToString(bytes);
                imageUrls.add("data:" + file.getContentType() + ";base64," + base64);
            }

            String prompt = visionPromptBuilder.buildIngredientDetectionPrompt(targetLanguage);

            String rawResponse = groqClient.sendVisionRequest(imageUrls, prompt);

            JsonNode jsonNode = objectMapper.readTree(rawResponse);

            List<String> ingredients = outputValidator.validateIngredientDetection(jsonNode);

            if (ingredients.isEmpty()) {
                throw new AppException(
                        ErrorCode.AI_VISION_FAILED,
                        "Не вдалося розпізнати інгредієнти або ШІ повернув некоректний формат.",
                        HttpStatus.BAD_REQUEST
                );
            }

            return new VisionResponse(ingredients);
        } catch (AppException e) {
            log.warn("Очікувана помилка при роботі з ШІ: {}", e.getMessage());
            throw e;

        } catch (Exception e) {
            log.error("Unexpected Vision API Error", e);
            throw new AppException(ErrorCode.AI_VISION_FAILED, "Внутрішня помилка сервера при обробці фото", HttpStatus.INTERNAL_SERVER_ERROR);
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