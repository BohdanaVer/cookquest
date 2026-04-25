package com.cookquest.recipe.dto;

import java.util.List;

public record RecipeListResponse(List<RecipeItem> recipes) {
}
