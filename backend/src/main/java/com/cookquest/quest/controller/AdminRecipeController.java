package com.cookquest.quest.controller;

import com.cookquest.recipe.dto.GenerateAdminRecipeRequest;
import com.cookquest.recipe.dto.RecipeListResponse;
import com.cookquest.recipe.service.RecipeService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/recipes")
@RequiredArgsConstructor
public class AdminRecipeController {

    private final RecipeService recipeService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/generate")
    public ResponseEntity<RecipeListResponse> generateAdminRecipes(
            @RequestBody GenerateAdminRecipeRequest request
    ) {
        return ResponseEntity.ok(recipeService.generateAdminRecipes(request));
    }

    /*
    // НОВИЙ МЕТОД ДЛЯ РЕДАГУВАННЯ ТЕКСТУ РЕЦЕПТА
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Void> updateSystemRecipe(
            @PathVariable String id,
            @RequestBody JsonNode recipeJson
    ) {
        // Перетворюємо JsonNode назад у String для збереження в базу
        recipeService.updateRecipeJson(id, recipeJson.toString());
        return ResponseEntity.ok().build();
    }
    */
}