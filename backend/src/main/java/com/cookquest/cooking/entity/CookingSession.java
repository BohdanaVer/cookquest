package com.cookquest.cooking.entity;

import com.cookquest.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cooking_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CookingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String recipeJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status; // IN_PROGRESS, COMPLETED, CANCELLED

    @Column(nullable = false)
    @Builder.Default
    private String verifiedSteps = "";

    @Column(nullable = false)
    private Integer earnedPoints = 0;     // Накопичені бали за рецепт

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}