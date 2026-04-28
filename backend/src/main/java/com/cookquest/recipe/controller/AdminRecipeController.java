package com.cookquest.recipe.controller;

import com.cookquest.recipe.dto.GenerateAdminRecipeRequest;
import com.cookquest.recipe.dto.RecipeListResponse;
import com.cookquest.recipe.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/recipes")
@RequiredArgsConstructor
public class AdminRecipeController {

    private final RecipeService recipeService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/generate")
    public ResponseEntity<RecipeListResponse> generateAdminRecipes(@RequestBody GenerateAdminRecipeRequest request) {
        return ResponseEntity.ok(recipeService.generateAdminRecipes(request));
    }

    // Тут же потім додаси ендпоінти для ручного редагування:
    // @PutMapping("/{id}")
    // public ResponseEntity<Void> updateSystemRecipe(...)
}
