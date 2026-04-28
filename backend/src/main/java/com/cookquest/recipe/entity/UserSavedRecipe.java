package com.cookquest.recipe.entity;

import com.cookquest.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_saved_recipes", indexes = {
        @Index(name = "idx_user_saved_recipe", columnList = "user_id, recipe_id", unique = true)
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSavedRecipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "recipe_id", nullable = false, length = 36)
    private String recipeId;

    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt;
}