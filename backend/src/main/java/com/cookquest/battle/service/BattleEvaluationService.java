package com.cookquest.battle.service;

import com.cookquest.battle.entity.Battle;
import com.cookquest.battle.entity.BattleParticipant;
import com.cookquest.battle.entity.BattleStatus;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class BattleEvaluationService {

    public void evaluateBattle(Battle battle, BattleParticipant p1, BattleParticipant p2, int referenceTimeMinutes) {
        calculateTotalScore(p1, referenceTimeMinutes);
        calculateTotalScore(p2, referenceTimeMinutes);

        int sum = p1.getTotalScore() + p2.getTotalScore();

        if (sum == 0) {
            battle.setStatus(BattleStatus.CANCELLED);
            battle.setWinnerId(null);
            p1.setEarnedXp(0);
            p1.setEarnedCoins(0);
            p2.setEarnedXp(0);
            p2.setEarnedCoins(0);
            return;
        }

        int xpPool = battle.getTotalXpPool();

        double p1Ratio = (double) p1.getTotalScore() / sum;
        int p1Xp = (int) Math.round(p1Ratio * xpPool);
        int p2Xp = xpPool - p1Xp; 

        p1.setEarnedXp(p1Xp);
        p2.setEarnedXp(p2Xp);

        if (p1.getTotalScore() > p2.getTotalScore()) {
            battle.setWinnerId(p1.getUserId());
            p1.setEarnedCoins(40);
            p2.setEarnedCoins(0);
        } else if (p2.getTotalScore() > p1.getTotalScore()) {
            battle.setWinnerId(p2.getUserId());
            p2.setEarnedCoins(40);
            p1.setEarnedCoins(0);
        } else {
            battle.setWinnerId(null);
            p1.setEarnedCoins(20);
            p2.setEarnedCoins(20);
        }

        battle.setStatus(BattleStatus.COMPLETED);
        battle.setCompletedAt(LocalDateTime.now());
    }

    private void calculateTotalScore(BattleParticipant p, int referenceTimeMinutes) {
        if (p.getQualityScore() == null || p.getSpeedScore() == null) {
            p.setTotalScore(0);
            return;
        }
        
        if (p.getQualityScore() == 0 && p.getSpeedScore() == 0) {
            p.setTotalScore(0);
            return;
        }

        int speedScore = p.getSpeedScore();
        int qualityScore = p.getQualityScore();
        p.setTotalScore((int) (qualityScore * 0.6 + speedScore * 0.4));
    }
}
