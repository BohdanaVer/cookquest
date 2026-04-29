package com.cookquest.recipe.entity;

import com.cookquest.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recipes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = true)
    private User author;

    @Column(name = "batch_id", nullable = true, length = 36)
    private String batchId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecipeOrigin origin;

    @Column(name = "recipe_json", columnDefinition = "TEXT", nullable = false)
    private String recipeJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_unlocked", nullable = false)
    @Builder.Default
    private boolean isUnlocked = false;
}