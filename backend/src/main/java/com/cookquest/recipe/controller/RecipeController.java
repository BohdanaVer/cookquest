package com.cookquest.recipe.controller;

import com.cookquest.recipe.dto.*;
import com.cookquest.recipe.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @PostMapping("/generate")
    public ResponseEntity<RecipeListResponse> generate(@RequestBody GenerateRecipeRequest request) {
        return ResponseEntity.ok(recipeService.generateRecipes(request));
    }

    @PostMapping(value = "/recognize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VisionResponse> recognize(
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(recipeService.recognizeIngredients(files));
    }
}