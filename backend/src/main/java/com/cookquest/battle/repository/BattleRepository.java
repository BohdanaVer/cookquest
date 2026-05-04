package com.cookquest.battle.repository;

import com.cookquest.battle.entity.Battle;
import com.cookquest.battle.entity.BattleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BattleRepository extends JpaRepository<Battle, Long> {
    
    @Query("SELECT b FROM Battle b JOIN BattleParticipant p ON b = p.battle WHERE p.userId = :userId AND b.status IN :statuses")
    List<Battle> findActiveBattlesByUserId(@Param("userId") Long userId, @Param("statuses") List<BattleStatus> statuses);

    @Query("SELECT b FROM Battle b JOIN BattleParticipant p ON b = p.battle WHERE p.userId = :userId AND b.status IN :statuses")
    List<Battle> findBattlesByUserIdAndStatuses(@Param("userId") Long userId, @Param("statuses") List<BattleStatus> statuses);
}
