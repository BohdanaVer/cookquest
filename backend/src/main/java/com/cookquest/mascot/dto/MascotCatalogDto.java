package com.cookquest.mascot.dto;

public record MascotCatalogDto (
        Long id,
        String name,
        String description, // Додано
        String type,
        String imageUrlHappy,
        String imageUrlNeutral,
        String imageUrlSad,
        Integer price,
        boolean isOwned,
        boolean isEquipped
) {}
