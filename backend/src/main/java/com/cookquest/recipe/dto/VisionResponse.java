package com.cookquest.recipe.dto;

import java.util.List;

public record VisionResponse(List<String> recognizedIngredients) {
}
