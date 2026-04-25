package com.cookquest.recipe.service;

import com.cookquest.recipe.dto.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface RecipeService {
    RecipeListResponse generateRecipes(GenerateRecipeRequest request);
    VisionResponse recognizeIngredients(List<MultipartFile> files);
}