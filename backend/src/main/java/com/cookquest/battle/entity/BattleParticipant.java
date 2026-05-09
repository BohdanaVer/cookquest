package com.cookquest.battle.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "battle_participants")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BattleParticipant {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne 
    @JoinColumn(name = "battle_id")
    private Battle battle;

    @Column(name = "user_id", nullable = false)
    private Long userId; 

    @Column(name = "cooking_session_id")
    private Long cookingSessionId; 

    @Column(name = "quality_score")
    private Integer qualityScore; 

    @Column(name = "speed_score")
    private Integer speedScore; 

    @Column(name = "total_score")
    private Integer totalScore; 

    @Column(name = "earned_xp")
    private Integer earnedXp; 

    @Column(name = "earned_coins")
    private Integer earnedCoins; 

    @Column(name = "is_finished")
    private boolean isFinished;

    @Column(name = "is_withdrawn", nullable = false, columnDefinition = "boolean not null default false")
    private boolean isWithdrawn;
}
