package com.cookquest.cooking.repository;

import com.cookquest.cooking.entity.CompletedQuest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompletedQuestRepository extends JpaRepository<CompletedQuest, Long> {
    // Цей метод потрібний для роботи CookingService
    boolean existsByUserIdAndQuestId(Long userId, Long questId);
}