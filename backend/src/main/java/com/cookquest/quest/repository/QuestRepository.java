package com.cookquest.quest.repository;

import com.cookquest.quest.entity.Quest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface QuestRepository extends JpaRepository<Quest, Long> {

    Optional<Quest> findByRecipeIdAndDayDate(String recipeId, LocalDate date);
}