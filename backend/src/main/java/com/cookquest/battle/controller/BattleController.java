package com.cookquest.battle.controller;

import com.cookquest.battle.dto.BattleResponse;
import com.cookquest.battle.dto.CreateBattleRequest;
import com.cookquest.battle.service.BattleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/v1/battles")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;

    @GetMapping("/active")
    public ResponseEntity<List<BattleResponse>> getActiveBattles() {
        return ResponseEntity.ok(battleService.getActiveBattles());
    }

    @GetMapping("/history")
    public ResponseEntity<List<BattleResponse>> getBattleHistory() {
        return ResponseEntity.ok(battleService.getBattleHistory());
    }

    @PostMapping
    public ResponseEntity<BattleResponse> createBattle(@RequestBody CreateBattleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(battleService.createBattle(request));
    }

    @PostMapping("/{battleId}/accept")
    public ResponseEntity<BattleResponse> acceptBattle(@PathVariable Long battleId) {
        return ResponseEntity.ok(battleService.acceptBattle(battleId));
    }

    @PostMapping("/{battleId}/decline")
    public ResponseEntity<BattleResponse> declineBattle(@PathVariable Long battleId) {
        return ResponseEntity.ok(battleService.cancelParticipation(battleId));
    }

    @GetMapping("/{battleId}")
    public ResponseEntity<BattleResponse> getBattleStatus(@PathVariable Long battleId) {
        return ResponseEntity.ok(battleService.getBattleStatus(battleId));
    }

    @PostMapping("/{battleId}/cancel")
    public ResponseEntity<BattleResponse> cancelParticipation(@PathVariable Long battleId) {
        return ResponseEntity.ok(battleService.cancelParticipation(battleId));
    }
}