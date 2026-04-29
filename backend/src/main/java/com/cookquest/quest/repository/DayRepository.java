package com.cookquest.quest.repository;

import com.cookquest.quest.entity.Day;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DayRepository extends JpaRepository<Day, Long> {
}