package com.cookquest.battle.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/battles")
public class BattleController {

    // Заглушка: Отримати всі активні батли користувача (додамо логіку в Завданні 1)
    @GetMapping("/active")
    public ResponseEntity<List<Object>> getActiveBattles() {
        // Поки повертаємо порожній список, щоб фронтенд не падав з 404 помилкою
        return ResponseEntity.ok(Collections.emptyList());
    }
}