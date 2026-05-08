package com.cookquest.profile.service;

import com.cookquest.profile.entity.Level;
import com.cookquest.profile.repository.LevelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class LevelSeeder implements CommandLineRunner {

    private final LevelRepository levelRepository;

    @Override
    public void run(String... args) {
        if (levelRepository.count() == 0) {
            log.info("Ініціалізація збалансованих рівнів у БД...");
            levelRepository.saveAll(List.of(
                    // Рівень 1: Старт
                    Level.builder().levelNumber(1).name("LEVEL_1").requiredXp(0).rewardCoins(0).build(),

                    // Рівень 2: Нагороди вистачить якраз на MASCOT_SLIMEY (100)
                    Level.builder().levelNumber(2).name("LEVEL_2").requiredXp(150).rewardCoins(100).build(),

                    // Рівень 3: Допоможе купити CHESSY (200) або PEPPY (300)
                    Level.builder().levelNumber(3).name("LEVEL_3").requiredXp(600).rewardCoins(150).build(),

                    // Рівень 4: Разом з ігровими монетами дозволить взяти EPIC маскота (500)
                    Level.builder().levelNumber(4).name("LEVEL_4").requiredXp(1500).rewardCoins(250).build(),

                    // Рівень 5: Хороший буст для купівлі CAULDRON (800)
                    Level.builder().levelNumber(5).name("LEVEL_5").requiredXp(3000).rewardCoins(400).build(),

                    // Рівень 6: Підготовка до покупки Легендарного Лицаря (1500)
                    Level.builder().levelNumber(6).name("LEVEL_6").requiredXp(6000).rewardCoins(800).build(),

                    // Рівень 7: Великий бонус, гравець вже серйозно збирає на Кастом
                    Level.builder().levelNumber(7).name("LEVEL_7").requiredXp(11000).rewardCoins(1200).build(),

                    // Рівень 8: Нагорода дорівнює рівно одній БЕЗКОШТОВНІЙ генерації ШІ маскота! (2000)
                    Level.builder().levelNumber(8).name("LEVEL_8").requiredXp(18000).rewardCoins(2000).build(),

                    // Рівень 9: Елітний рівень
                    Level.builder().levelNumber(9).name("LEVEL_9").requiredXp(28000).rewardCoins(3000).build(),

                    // Рівень 10: Легенда гри (вистачить на 2.5 кастомні генерації)
                    Level.builder().levelNumber(10).name("LEVEL_10").requiredXp(45000).rewardCoins(5000).build()
            ));
        }
    }
}