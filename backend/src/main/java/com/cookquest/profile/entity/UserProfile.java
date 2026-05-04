package com.cookquest.profile.entity;

import com.cookquest.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor // Обов'язково для роботи @Builder
@Builder            // Додаємо білдер
public class UserProfile {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private int xp;
    private int level;
    private int balance;
    private int ratingScore;

    @Enumerated(EnumType.STRING)
    private Language language;

    @Column(name = "active_mascot_id")
    private Long activeMascotId;

    @Builder.Default // ВАЖЛИВО: щоб білдер зберіг це дефолтне значення
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private DietaryPreferences dietaryPreferences = new DietaryPreferences();
}