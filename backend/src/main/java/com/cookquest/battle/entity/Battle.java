package com.cookquest.battle.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "battles")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Battle {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipe_id", nullable = false)
    private String recipeId;

    @Enumerated(EnumType.STRING)
    private BattleStatus status; 

    @Column(name = "total_xp_pool")
    private Integer totalXpPool; 

    @Column(name = "winner_id")
    private Long winnerId; 

    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
