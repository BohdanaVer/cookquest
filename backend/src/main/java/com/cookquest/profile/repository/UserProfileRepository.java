package com.cookquest.profile.repository;

import com.cookquest.profile.entity.UserProfile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    @Query("SELECT p FROM UserProfile p JOIN FETCH p.level JOIN FETCH p.user ORDER BY p.xp DESC")
    List<UserProfile> findTopProfilesByXp(Pageable pageable);

    List<UserProfile> findByUserUsernameContainingIgnoreCaseAndIdNot(String username, Long id);

    @Query(value = "SELECT * FROM user_profiles WHERE user_id NOT IN :excludedIds ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<UserProfile> findRandomProfilesExcluding(@Param("excludedIds") List<Long> excludedIds, @Param("limit") int limit);
}