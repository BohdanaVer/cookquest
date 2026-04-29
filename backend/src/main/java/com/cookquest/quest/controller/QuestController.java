package com.cookquest.quest.controller;

import com.cookquest.quest.entity.Quest;
import com.cookquest.quest.service.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quests")
@RequiredArgsConstructor
public class QuestController {

    private final QuestService questService;

    @GetMapping
    public ResponseEntity<List<Quest>> getAvailableQuests() {
        // Поки що можемо використовувати той самий метод, що і для адміна,
        // щоб просто вивести список квестів на фронтенд.
        // У майбутньому тут можна зробити фільтрацію (наприклад, віддавати лише квести на сьогоднішній тиждень).
        return ResponseEntity.ok(questService.getAllQuestsForAdmin());
    }
}