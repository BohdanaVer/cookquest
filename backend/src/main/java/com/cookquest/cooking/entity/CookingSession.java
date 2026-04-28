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
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "recipe_id", nullable = false, length = 36)
    private String recipeId;

    @Column(name = "batch_id", nullable = true, length = 36)
    private String batchId;

    @Column(name = "recipe_json", columnDefinition = "TEXT", nullable = false)
    private String recipeJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SessionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "xp_mode", nullable = false, length = 20)
    private XpMode xpMode;

    @Column(name = "verified_steps", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String verifiedSteps = "";

    @Column(name = "earned_points", nullable = false)
    @Builder.Default
    private Integer earnedPoints = 0;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}