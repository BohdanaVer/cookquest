package com.cookquest.quest.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipe_id", nullable = false, length = 36)
    private String recipeId;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_id", nullable = false, unique = true)
    private Day day;

    @Column(name = "xp_multiplier", nullable = false)
    @Builder.Default
    private Double xpMultiplier = 1.0;

    @Column(name = "cuisine_name")
    private String cuisineName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private QuestStatus status = QuestStatus.AVAILABLE;

    public Long getDayId() {
        return day != null ? day.getId() : null;
    }
}