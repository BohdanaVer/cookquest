package com.cookquest.recipe.service;

import com.cookquest.auth.entity.CustomUserDetails;
import com.cookquest.auth.entity.User;
import com.cookquest.common.exception.AppException;
import com.cookquest.profile.entity.Language;
import com.cookquest.profile.entity.UserProfile;
import com.cookquest.common.ai.GroqClient;
import com.cookquest.recipe.ai.prompt.RecipePromptBuilder;
import com.cookquest.recipe.ai.prompt.VisionPromptBuilder;
import com.cookquest.recipe.ai.validator.InputSanitizer;
import com.cookquest.recipe.ai.validator.OutputValidator;
import com.cookquest.recipe.dto.*;
import com.cookquest.recipe.entity.Recipe;
import com.cookquest.recipe.entity.RecipeOrigin;
import com.cookquest.recipe.repository.RecipeRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cookquest.common.exception.ErrorCode;

import java.time.LocalDateTime;
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
    private final RecipeRepository recipeRepository;


    public RecipeListResponse generateUserRecipes(GenerateRecipeRequest request) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User myUser = userDetails.getUser();
        UserProfile profile = myUser.getProfile();

        String targetLanguage = resolveLanguage(request.requestLanguage(), profile);
        String batchId = java.util.UUID.randomUUID().toString();

        return processGeneration(
                request.ingredients(),
                request.textQuery(),
                null,
                profile,
                targetLanguage,
                4,
                RecipeOrigin.USER,
                myUser,
                batchId
        );
    }


    public RecipeListResponse generateAdminRecipes(GenerateAdminRecipeRequest request) {
        String targetLanguage = resolveLanguage(request.requestLanguage(), null);

        return processGeneration(
                request.ingredients(),
                request.textQuery(),
                request.challengeCuisine(),
                null,
                targetLanguage,
                request.count(),
                RecipeOrigin.ADMIN,
                null,
                null
        );
    }


    private RecipeListResponse processGeneration(
            List<String> rawIngredients,
            String rawTextQuery,
            String challengeCuisine,
            UserProfile profile,
            String targetLanguage,
            int count,
            RecipeOrigin origin,
            User author,
            String batchId) {

        List<String> safeIngredients = null;
        if (rawIngredients != null && !rawIngredients.isEmpty()) {
            safeIngredients = inputSanitizer.sanitizeIngredientList(rawIngredients);
        }

        String safeTextQuery = null;
        if (rawTextQuery != null && !rawTextQuery.isBlank()) {
            InputSanitizer.SanitizeResult result = inputSanitizer.sanitizeUserComment(rawTextQuery);
            if (!result.safe()) {
                throw new AppException(ErrorCode.SECURITY_VIOLATION, result.message(), HttpStatus.BAD_REQUEST);
            }
            safeTextQuery = result.sanitized();
        }

        if ((safeIngredients == null || safeIngredients.isEmpty()) && safeTextQuery == null && challengeCuisine == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Будь ласка, введіть запит, додайте інгредієнти або вкажіть кухню.", HttpStatus.BAD_REQUEST);
        }

        String messagesPayload = recipePromptBuilder.buildUnifiedRecipeMessages(
                safeIngredients, safeTextQuery, challengeCuisine, profile, targetLanguage, count
        );

        String rawJson = groqClient.sendTextRequest(messagesPayload);

        try {
            JsonNode rootNode = objectMapper.readTree(rawJson);
            List<JsonNode> validatedNodes = outputValidator.validateRecipeList(rootNode, count);

            if (validatedNodes.isEmpty()) {
                log.error("AI returned invalid recipes. Raw response: {}", rawJson);
                throw new AppException(ErrorCode.AI_GENERATION_FAILED, "ШІ не зміг створити валідні рецепти.", HttpStatus.SERVICE_UNAVAILABLE);
            }

            List<RecipeItem> safeRecipes = new ArrayList<>();

            for (JsonNode node : validatedNodes) {
                try {
                    String recipeJsonForDb = objectMapper.writeValueAsString(node);

                    com.cookquest.recipe.entity.Recipe recipeEntity = com.cookquest.recipe.entity.Recipe.builder()
                            .author(author)
                            .origin(origin)
                            .batchId(batchId)
                            .recipeJson(recipeJsonForDb)
                            .createdAt(LocalDateTime.now())
                            .build();

                    recipeEntity = recipeRepository.save(recipeEntity);

                    List<IngredientDTO> parsedIngredients = new ArrayList<>();
                    if (node.has("ingredients") && node.get("ingredients").isArray()) {
                        for (JsonNode ingNode : node.get("ingredients")) {
                            parsedIngredients.add(objectMapper.treeToValue(ingNode, IngredientDTO.class));
                        }
                    }

                    List<String> dietaryTags = new ArrayList<>();
                    if (node.has("dietaryTags") && node.get("dietaryTags").isArray()) {
                        for (JsonNode tagNode : node.get("dietaryTags")) {
                            dietaryTags.add(tagNode.asText());
                        }
                    }

                    RecipeItem finalItem = new RecipeItem(
                            node.path("name").asText(),
                            node.path("description").asText(),
                            node.path("difficulty").asText(),
                            node.path("points").asInt(),
                            node.path("cookingTimeMinutes").asInt(),
                            node.path("cuisine").asText(),
                            dietaryTags,
                            parsedIngredients,
                            node.path("steps").size(),
                            recipeEntity.getId()
                    );

                    safeRecipes.add(finalItem);

                } catch (Exception e) {
                    log.error("Помилка обробки окремого рецепта: {}", node.path("name").asText(), e);
                }
            }

            if (safeRecipes.isEmpty()) {
                throw new AppException(ErrorCode.AI_GENERATION_FAILED, "На жаль, ШІ згенерував рецепти у некоректному форматі.", HttpStatus.SERVICE_UNAVAILABLE);
            }

            return new RecipeListResponse(safeRecipes);

        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", rawJson, e);
            throw new AppException(ErrorCode.AI_GENERATION_FAILED, "Помилка обробки рецептів від ШІ", HttpStatus.INTERNAL_SERVER_ERROR);
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

//    @Transactional
//    public void updateRecipeJson(String recipeId, String newRecipeJson) {
//        Recipe recipe = recipeRepository.findById(recipeId)
//                .orElseThrow(() -> new RuntimeException("Рецепт не знайдено з id: " + recipeId));
//
//        recipe.setRecipeJson(newRecipeJson);
//        recipeRepository.save(recipe);
//    }
}