package com.cookquest.cooking.repository;

import com.cookquest.auth.entity.User;
import com.cookquest.cooking.entity.CookingSession;
import com.cookquest.cooking.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CookingSessionRepository extends JpaRepository<CookingSession, Long> {
    List<CookingSession> findAllByUserAndStatus(User user, SessionStatus status);

    boolean existsByUserIdAndRecipeIdAndStatus(Long userId, String recipeId, SessionStatus status);

    boolean existsByUserIdAndBatchIdAndStatus(Long userId, String batchId, SessionStatus status);

    @Query("SELECT COUNT(c) FROM CookingSession c WHERE c.user.id = :userId AND c.xpMode = 'REDUCED' AND c.startedAt >= :startOfDay")
    long countReducedXpCooksToday(@org.springframework.data.repository.query.Param("userId") Long userId, @org.springframework.data.repository.query.Param("startOfDay") java.time.LocalDateTime startOfDay);
}