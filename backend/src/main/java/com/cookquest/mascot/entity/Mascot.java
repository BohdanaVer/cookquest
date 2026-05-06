package com.cookquest.mascot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "mascots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mascot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MascotType type;

    @Column(name = "image_url_happy", nullable = false)
    private String imageUrlHappy;

    @Column(name = "image_url_neutral", nullable = false)
    private String imageUrlNeutral;

    @Column(name = "image_url_sad", nullable = false)
    private String imageUrlSad;

    @Column(nullable = false)
    private Integer price;

    @Column(name = "creator_id")
    private Long creatorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MascotRarity rarity;
}
