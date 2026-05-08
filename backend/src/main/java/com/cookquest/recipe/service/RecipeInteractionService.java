package com.cookquest.recipe.service;

import com.cookquest.auth.entity.CustomUserDetails;
import com.cookquest.auth.entity.User;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.recipe.dto.RecipeItem;
import com.cookquest.recipe.dto.IngredientDTO;
import com.cookquest.recipe.dto.StepDTO;
import com.cookquest.recipe.entity.Recipe;
import com.cookquest.recipe.entity.UserSavedRecipe;
import com.cookquest.recipe.integration.CookingRewardIntegrationService;
import com.cookquest.recipe.repository.RecipeRepository;
import com.cookquest.recipe.repository.UserSavedRecipeRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecipeInteractionService {

    private final RecipeRepository recipeRepository;
    private final UserSavedRecipeRepository savedRecipeRepository;
    private final ObjectMapper objectMapper;

    private final CookingRewardIntegrationService cookingRewardService;

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userDetails.getUser();
    }

    // ==========================================
    // 1. Отримати за ID (З розблокуванням)
    // ==========================================
    @Transactional
    public RecipeItem getRecipeById(String id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RECIPE_NOT_FOUND, "Рецепт не знайдено", HttpStatus.NOT_FOUND));

        unlockRecipeIfNeeded(recipe);
        return parseRecipeItem(recipe, getCurrentUser());
    }

    // ==========================================
    // 2. Зберегти рецепт собі
    // ==========================================
    @Transactional
    public void saveRecipe(String recipeId) {
        User user = getCurrentUser();

        if (!recipeRepository.existsById(recipeId)) {
            throw new AppException(ErrorCode.RECIPE_NOT_FOUND, "Рецепт не знайдено", HttpStatus.NOT_FOUND);
        }

        if (savedRecipeRepository.existsByUserIdAndRecipeId(user.getId(), recipeId)) {
            return;
        }

        savedRecipeRepository.save(
                UserSavedRecipe.builder()
                        .user(user)
                        .recipeId(recipeId)
                        .savedAt(LocalDateTime.now())
                        .build()
        );
    }

    // ==========================================
    // 3. Видалити зі збереженого
    // ==========================================
    @Transactional
    public void unsaveRecipe(String recipeId) {
        User user = getCurrentUser();
        savedRecipeRepository.deleteByUserIdAndRecipeId(user.getId(), recipeId);
    }

    // ==========================================
    // 4. Мої збережені (З масовим розблокуванням)
    // ==========================================
    @Transactional
    public List<RecipeItem> getMySavedRecipes() {
        User user = getCurrentUser();

        List<String> savedIds = savedRecipeRepository.findByUserIdOrderBySavedAtDesc(user.getId()).stream()
                .map(UserSavedRecipe::getRecipeId)
                .toList();

        List<Recipe> recipes = recipeRepository.findAllById(savedIds);
        unlockRecipesIfNeeded(recipes);

        return recipes.stream()
                .map(recipe -> parseRecipeItem(recipe, user))
                .collect(Collectors.toList());
    }

    // ==========================================
    // 5. Моя історія (З масовим розблокуванням)
    // ==========================================
    @Transactional
    public List<RecipeItem> getMyGeneratedHistory() {
        User user = getCurrentUser();
        List<Recipe> recipes = recipeRepository.findByAuthorIdOrderByCreatedAtDesc(user.getId());

        unlockRecipesIfNeeded(recipes);

        return recipes.stream()
                .map(recipe -> parseRecipeItem(recipe, user))
                .collect(Collectors.toList());
    }

    // ==========================================
    // Хелпери розблокування
    // ==========================================
    private void unlockRecipeIfNeeded(Recipe recipe) {
        if (!recipe.isUnlocked()) {
            recipe.setUnlocked(true);
            recipeRepository.save(recipe);
        }
    }

    private void unlockRecipesIfNeeded(List<Recipe> recipes) {
        List<Recipe> toUnlock = recipes.stream()
                .filter(r -> !r.isUnlocked())
                .toList();

        if (!toUnlock.isEmpty()) {
            toUnlock.forEach(r -> r.setUnlocked(true));
            recipeRepository.saveAll(toUnlock);
        }
    }

    // ==========================================
    // Парсер (Тепер з делегуванням розрахунку балів)
    // ==========================================
    private RecipeItem parseRecipeItem(Recipe recipe, User user) {
        try {
            JsonNode node = objectMapper.readTree(recipe.getRecipeJson());

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

            List<StepDTO> parsedSteps = new ArrayList<>();
            if (node.has("steps") && node.get("steps").isArray()) {
                for (JsonNode stepNode : node.get("steps")) {
                    parsedSteps.add(new StepDTO(
                            stepNode.path("text").asText(),
                            stepNode.path("isCheckpoint").asBoolean(),
                            stepNode.path("checkpointLabel").asText(null)
                    ));
                }
            }

            int basePoints = node.path("points").asInt(50);

            Long authorId = recipe.getAuthor() != null ? recipe.getAuthor().getId() : null;
            int finalPoints = cookingRewardService.calculatePotentialPoints(
                    user.getId(),
                    recipe.getId(),
                    recipe.getBatchId(),
                    authorId,
                    basePoints
            );

            return new RecipeItem(
                    node.path("name").asText(),
                    node.path("description").asText(),
                    node.path("difficulty").asText(),
                    finalPoints,
                    node.path("cookingTimeMinutes").asInt(),
                    node.path("cuisine").asText(),
                    dietaryTags,
                    parsedIngredients,
                    parsedSteps,
                    node.path("steps").size(),
                    recipe.getId()
            );
        } catch (Exception e) {
            log.error("Помилка парсингу рецепта {}", recipe.getId(), e);
            throw new AppException(ErrorCode.RECIPE_PARSE_ERROR, "Помилка читання даних рецепта з бази", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}