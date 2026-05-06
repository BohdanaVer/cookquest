package com.cookquest.profile.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "levels")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Level {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "level_number", nullable = false, unique = true)
    private Integer levelNumber;

    @Column(nullable = false)
    private String name;

    @Column(name = "required_xp", nullable = false)
    private Integer requiredXp;

    @Column(name = "reward_coins", nullable = false)
    private Integer rewardCoins;
}