package com.cookquest.mascot.repository;

import com.cookquest.mascot.entity.Mascot;
import com.cookquest.mascot.entity.MascotType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MascotRepository extends JpaRepository<Mascot, Long> {

    List<Mascot> findByType(MascotType type);

    @Query("SELECT m FROM Mascot m WHERE m.type = :type OR (m.type = :customType AND m.creatorId = :userId)")
    List<Mascot> findBaseAndUserCustomMascots(@Param("type") MascotType type, @Param("customType") MascotType customType, @Param("userId") Long userId);
}
