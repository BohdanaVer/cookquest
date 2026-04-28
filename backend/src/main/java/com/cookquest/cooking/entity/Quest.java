package com.cookquest.cooking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "quests")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Quest {
    // Наступні поля потрібні для коректної роботи cookingService
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipe_id", nullable = false, length = 36)
    private String recipeId;

    @Column(name = "active_date", nullable = false)
    private LocalDate activeDate;

    @Column(name = "xp_multiplier", nullable = false)
    @Builder.Default
    private Double xpMultiplier = 1.0;
    // Кінець нобхідних полів


    @Column(name = "cuisine_name")
    private String cuisineName;
}