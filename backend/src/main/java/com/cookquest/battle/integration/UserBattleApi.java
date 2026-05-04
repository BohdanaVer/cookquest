package com.cookquest.battle.integration;


public interface UserBattleApi {
    Long getUserIdByUsername(String username);

    String getUsernameById(Long userId);


}
