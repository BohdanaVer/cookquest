package com.cookquest.mascot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_mascots", indexes = {
    @Index(name = "idx_user_mascot", columnList = "user_id, mascot_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMascot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mascot_id", nullable = false)
    private Mascot mascot;

    @Column(name = "acquired_at", nullable = false)
    private LocalDateTime acquiredAt;
}
