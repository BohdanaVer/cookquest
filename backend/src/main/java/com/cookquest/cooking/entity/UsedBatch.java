package com.cookquest.cooking.entity;

import com.cookquest.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "used_batches", indexes = {
        @Index(name = "idx_user_batch", columnList = "user_id, batch_id", unique = true)
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UsedBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "batch_id", nullable = false, length = 36)
    private String batchId;

    @Column(nullable = false)
    private LocalDateTime usedAt;
}