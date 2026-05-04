package com.cookquest.battle.repository;

import com.cookquest.battle.entity.BattleParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BattleParticipantRepository extends JpaRepository<BattleParticipant, Long> {
    List<BattleParticipant> findByBattleId(Long battleId);
    BattleParticipant findByBattleIdAndUserId(Long battleId, Long userId);
    BattleParticipant findByCookingSessionId(Long cookingSessionId);
}
