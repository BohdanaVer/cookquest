package com.cookquest.recipe.repository;

import com.cookquest.recipe.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, String> {

    List<Recipe> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
}
