package com.cookquest.mascot.integration;

public interface EconomyMascotApi {
    boolean hasEnoughCoins(Long userId, int amount);
    void deductCoins(Long userId, int amount);
}
