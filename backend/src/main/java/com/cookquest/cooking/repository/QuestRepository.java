package com.cookquest.cooking.repository;

import com.cookquest.cooking.entity.Quest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;

public interface QuestRepository extends JpaRepository<Quest, Long> {
    // Цей метод потрібний для роботи CookingService
    Quest findByRecipeIdAndActiveDate(String recipeId, LocalDate activeDate);
}