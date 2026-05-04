package com.cookquest.mascot.repository;

import com.cookquest.mascot.entity.UserMascot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserMascotRepository extends JpaRepository<UserMascot, Long> {

    List<UserMascot> findByUserId(Long userId);

    boolean existsByUserIdAndMascotId(Long userId, Long mascotId);
}
