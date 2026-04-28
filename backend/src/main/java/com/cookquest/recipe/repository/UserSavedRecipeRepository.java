package com.cookquest.recipe.repository;

import com.cookquest.recipe.entity.UserSavedRecipe;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSavedRecipeRepository extends JpaRepository<UserSavedRecipe, Long> {
    boolean existsByUserIdAndRecipeId(Long userId, String recipeId);
}