package com.cookquest.quest.controller;

import com.cookquest.quest.dto.QuestRequestDTO;
import com.cookquest.quest.dto.WeekRequestDTO;
import com.cookquest.quest.entity.Quest;
import com.cookquest.quest.entity.Week;
import com.cookquest.quest.service.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/quests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminQuestController {

    private final QuestService questService;

    @GetMapping
    public ResponseEntity<List<Quest>> getAllQuests() {
        return ResponseEntity.ok(questService.getAllQuestsForAdmin());
    }

    @PostMapping
    public ResponseEntity<Quest> createQuest(@RequestBody QuestRequestDTO request) {
        return ResponseEntity.ok(questService.createQuest(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Quest> updateQuest(@PathVariable Long id, @RequestBody QuestRequestDTO request) {
        return ResponseEntity.ok(questService.updateQuest(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuest(@PathVariable Long id) {
        questService.deleteQuest(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/weeks")
    public ResponseEntity<List<Week>> getAllWeeks() {
        return ResponseEntity.ok(questService.getAllWeeks());
    }

    @PostMapping("/weeks")
    public ResponseEntity<Week> createWeek(@RequestBody WeekRequestDTO request) {
        return ResponseEntity.ok(questService.createWeek(request));
    }
}