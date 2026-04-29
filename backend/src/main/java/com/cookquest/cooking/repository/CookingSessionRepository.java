package com.cookquest.cooking.repository;

import com.cookquest.auth.entity.User;
import com.cookquest.cooking.entity.CookingSession;
import com.cookquest.cooking.entity.SessionStatus;
import com.cookquest.cooking.entity.XpMode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CookingSessionRepository extends JpaRepository<CookingSession, Long> {
    List<CookingSession> findAllByUserAndStatus(User user, SessionStatus status);

    boolean existsByUserIdAndRecipeIdAndStatus(Long userId, String recipeId, SessionStatus status);

    boolean existsByUserIdAndBatchIdAndStatus(Long userId, String batchId, SessionStatus status);

    long countByUserIdAndXpModeAndStartedAtAfter(Long userId, XpMode xpMode, LocalDateTime startOfDay);

    Optional<CookingSession> findFirstByUserIdAndRecipeIdAndStatus(Long userId, String recipeId, SessionStatus status);
}