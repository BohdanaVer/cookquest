package com.cookquest.quest.controller;

import com.cookquest.auth.entity.CustomUserDetails;
import com.cookquest.quest.dto.QuestResponseDto;
import com.cookquest.quest.service.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public ResponseEntity<List<QuestResponseDto>> getUserQuests(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(questService.getQuestsForUser(userDetails.getId()));
    }
}