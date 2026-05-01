package com.cookquest.quest.entity;

import com.cookquest.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "completed_quests", indexes = {
        @Index(name = "idx_user_quest", columnList = "user_id, quest_id", unique = true)
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CompletedQuest {

    // Наступні поля потрібні для коректної роботи cookingService
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quest_id", nullable = false)
    private Quest quest;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;
    // Кінець нобхідних полів


    @Column(name = "completed_at", nullable = true)
    private LocalDateTime completedAt;
}