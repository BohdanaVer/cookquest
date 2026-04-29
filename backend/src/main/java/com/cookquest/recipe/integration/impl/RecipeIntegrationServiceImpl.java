package com.cookquest.recipe.integration.impl;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.cooking.integration.RecipeCookingData;
import com.cookquest.cooking.integration.RecipeIntegrationService;
import com.cookquest.recipe.entity.Recipe;
import com.cookquest.recipe.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecipeIntegrationServiceImpl implements RecipeIntegrationService {

    private final RecipeRepository recipeRepository;

    @Override
    public RecipeCookingData getRecipeData(String recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Рецепт не знайдено", HttpStatus.NOT_FOUND));

        Long authorId = recipe.getAuthor() != null ? recipe.getAuthor().getId() : null;

        return new RecipeCookingData(
                recipe.getId(),
                authorId,
                recipe.getBatchId(),
                recipe.getRecipeJson(),
                recipe.isUnlocked()
        );
    }

    @Override
    @Transactional
    public void unlockRecipe(String recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Рецепт не знайдено", HttpStatus.NOT_FOUND));

        if (!recipe.isUnlocked()) {
            recipe.setUnlocked(true);
            recipeRepository.save(recipe);
        }
    }
}