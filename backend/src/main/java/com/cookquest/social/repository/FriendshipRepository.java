package com.cookquest.social.repository;

import com.cookquest.social.entity.Friendship;
import com.cookquest.social.entity.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByRequesterIdAndReceiverId(Long requesterId, Long receiverId);

    @Query("SELECT f FROM Friendship f WHERE (f.requesterId = :userId OR f.receiverId = :userId) AND f.status = :status")
    List<Friendship> findAllFriendsByUserIdAndStatus(@Param("userId") Long userId, @Param("status") FriendshipStatus status);

    List<Friendship> findByReceiverIdAndStatus(Long receiverId, FriendshipStatus status);

    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE (f.requesterId = :userId1 AND f.receiverId = :userId2) OR (f.requesterId = :userId2 AND f.receiverId = :userId1)")
    boolean existsByUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
