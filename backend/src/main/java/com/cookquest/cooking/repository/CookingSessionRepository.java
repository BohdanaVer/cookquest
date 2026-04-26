package com.cookquest.cooking.repository;

import com.cookquest.auth.entity.User;
import com.cookquest.cooking.entity.CookingSession;
import com.cookquest.cooking.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CookingSessionRepository extends JpaRepository<CookingSession, Long> {
    // Шукаємо всі активні сесії конкретного користувача
    List<CookingSession> findAllByUserAndStatus(User user, SessionStatus status);
}