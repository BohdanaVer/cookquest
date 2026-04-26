package com.cookquest.cooking.repository;

import com.cookquest.cooking.entity.UsedBatch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsedBatchRepository extends JpaRepository<UsedBatch, Long> {
    boolean existsByUserIdAndBatchId(Long userId, String batchId);
}