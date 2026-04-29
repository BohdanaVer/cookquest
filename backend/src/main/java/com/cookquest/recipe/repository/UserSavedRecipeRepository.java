package com.cookquest.recipe.repository;

import com.cookquest.recipe.entity.UserSavedRecipe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserSavedRecipeRepository extends JpaRepository<UserSavedRecipe, Long> {
    List<UserSavedRecipe> findByUserIdOrderBySavedAtDesc(Long userId);

    // Перевірити, чи я вже зберіг цей рецепт (щоб не було дублів)
    boolean existsByUserIdAndRecipeId(Long userId, String recipeId);

    // Видалити зі збереженого
    void deleteByUserIdAndRecipeId(Long userId, String recipeId);
}