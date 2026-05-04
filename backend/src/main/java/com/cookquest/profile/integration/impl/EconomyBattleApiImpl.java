package com.cookquest.profile.integration.impl;

import com.cookquest.battle.integration.EconomyBattleApi;
import com.cookquest.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EconomyBattleApiImpl implements EconomyBattleApi {

    private final ProfileService profileService;

    @Override
    public void awardBattleResults(Long userId, int earnedXp, int earnedCoins) {
        // У нашій системі earnedCoins = balance, earnedXp = xp/ratingScore
        // Ми можемо перевикористати метод awardCookingRewards, який 
        // додає і баланс, і xp, і ratingScore одночасно. Але якщо xp і монети 
        // різні, ми можемо додати окремий метод.
        // Згідно з логікою ProfileService:
        // profile.setXp(profile.getXp() + amount);
        // profile.setRatingScore(profile.getRatingScore() + amount);
        // profile.setBalance(profile.getBalance() + amount);
        // Оскільки earnedCoins може бути 40, а earnedXp 120, краще зробити 
        // окремий метод у ProfileService. Але для простоти ми викличемо існуючий,
        // або додамо метод awardBattleRewards.
        
        profileService.awardBattleRewards(userId, earnedXp, earnedCoins);
    }
}
