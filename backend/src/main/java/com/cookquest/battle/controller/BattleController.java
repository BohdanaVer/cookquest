package com.cookquest.battle.controller;

import com.cookquest.battle.dto.BattleResponse;
import com.cookquest.battle.dto.CreateBattleRequest;
import com.cookquest.battle.service.BattleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/battles")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;

    @GetMapping("/active")
    public List<BattleResponse> getActiveBattles() {
        return battleService.getActiveBattles();
    }

    @GetMapping("/history")
    public List<BattleResponse> getBattleHistory() {
        return battleService.getBattleHistory();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BattleResponse createBattle(@RequestBody CreateBattleRequest request) {
        return battleService.createBattle(request);
    }

    @PostMapping("/{battleId}/accept")
    public BattleResponse acceptBattle(@PathVariable Long battleId) {
        return battleService.acceptBattle(battleId);
    }

    @PostMapping("/{battleId}/decline")
    public BattleResponse declineBattle(@PathVariable Long battleId) {
        return battleService.cancelParticipation(battleId);
    }

    @GetMapping("/{battleId}")
    public BattleResponse getBattleStatus(@PathVariable Long battleId) {
        return battleService.getBattleStatus(battleId);
    }

    @PostMapping("/{battleId}/submit")
    public BattleResponse submitDish(@PathVariable Long battleId) {
        return battleService.submitParticipant(battleId);
    }

    @PostMapping("/{battleId}/cancel")
    public BattleResponse cancelParticipation(@PathVariable Long battleId) {
        return battleService.cancelParticipation(battleId);
    }
}