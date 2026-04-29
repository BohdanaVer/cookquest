package com.cookquest.recipe.controller;

import com.cookquest.recipe.dto.RecipeItem;
import com.cookquest.recipe.service.RecipeInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recipes")
@RequiredArgsConstructor
public class RecipeInteractionController {

    private final RecipeInteractionService interactionService;

    // 1. Отримати конкретний рецепт (Шеринг / Перегляд перед готуванням)
    @GetMapping("/{id}")
    public ResponseEntity<RecipeItem> getRecipeById(@PathVariable String id) {
        return ResponseEntity.ok(interactionService.getRecipeById(id));
    }

    // 2. Зберегти рецепт собі
    @PostMapping("/{id}/save")
    public ResponseEntity<Void> saveRecipe(@PathVariable String id) {
        interactionService.saveRecipe(id);
        return ResponseEntity.ok().build();
    }

    // 3. Видалити зі збереженого
    @DeleteMapping("/{id}/save")
    public ResponseEntity<Void> unsaveRecipe(@PathVariable String id) {
        interactionService.unsaveRecipe(id);
        return ResponseEntity.ok().build();
    }

    // 4. Отримати список моїх закладок
    @GetMapping("/saved")
    public ResponseEntity<List<RecipeItem>> getSavedRecipes() {
        return ResponseEntity.ok(interactionService.getMySavedRecipes());
    }

    // 5. Отримати історію моїх генерацій
    @GetMapping("/history")
    public ResponseEntity<List<RecipeItem>> getGeneratedHistory() {
        return ResponseEntity.ok(interactionService.getMyGeneratedHistory());
    }
}