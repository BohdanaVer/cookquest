package com.cookquest.profile.repository;

import com.cookquest.profile.entity.Level;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface LevelRepository extends JpaRepository<Level, Long> {
    Optional<Level> findFirstByRequiredXpLessThanEqualOrderByRequiredXpDesc(Integer requiredXp);

    Optional<Level> findByLevelNumber(Integer levelNumber);
}