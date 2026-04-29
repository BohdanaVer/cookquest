package com.cookquest.quest.repository;

import com.cookquest.quest.entity.CompletedQuest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompletedQuestRepository extends JpaRepository<CompletedQuest, Long> {
    // Цей метод потрібний для роботи CookingService
    boolean existsByUserIdAndQuestId(Long userId, Long questId);

    Optional<CompletedQuest> findByUserIdAndQuestId(Long userId, Long id);
}