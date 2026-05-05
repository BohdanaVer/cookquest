package com.cookquest.social.service;

import com.cookquest.auth.service.CurrentUserService;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.social.dto.FriendDto;
import com.cookquest.social.dto.FriendRequestDto;
import com.cookquest.social.entity.Friendship;
import com.cookquest.social.entity.FriendshipStatus;
import com.cookquest.social.integration.ProfileSocialApi;
import com.cookquest.social.repository.FriendshipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final ProfileSocialApi profileSocialApi;
    private final CurrentUserService currentUserService;

    private Long getCurrentUserId() {
        return currentUserService.getCurrentUser().getId();
    }

    @Transactional
    public Friendship sendRequest(String targetUsername) {
        Long currentUserId = getCurrentUserId();
        Long targetUserId = profileSocialApi.getUserIdByUsername(targetUsername);

        if (targetUserId == null) {
            throw new AppException(ErrorCode.NOT_FOUND, "Користувача не знайдено", HttpStatus.NOT_FOUND);
        }

        if (currentUserId.equals(targetUserId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Не можна додати самого себе", HttpStatus.BAD_REQUEST);
        }

        if (friendshipRepository.existsByUsers(currentUserId, targetUserId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Запит або дружба вже існує", HttpStatus.BAD_REQUEST);
        }

        Friendship friendship = Friendship.builder()
                .requesterId(currentUserId)
                .receiverId(targetUserId)
                .status(FriendshipStatus.PENDING)
                .build();

        return friendshipRepository.save(friendship);
    }

    @Transactional
    public Friendship acceptRequest(Long friendshipId) {
        Long currentUserId = getCurrentUserId();
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Запит не знайдено", HttpStatus.NOT_FOUND));

        if (!friendship.getReceiverId().equals(currentUserId)) {
            throw new AppException(ErrorCode.SECURITY_VIOLATION, "Це не ваш запит", HttpStatus.FORBIDDEN);
        }

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Запит вже оброблено", HttpStatus.BAD_REQUEST);
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        return friendshipRepository.save(friendship);
    }

    @Transactional
    public void declineRequest(Long friendshipId) {
        Long currentUserId = getCurrentUserId();
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Запит не знайдено", HttpStatus.NOT_FOUND));

        if (!friendship.getReceiverId().equals(currentUserId) && !friendship.getRequesterId().equals(currentUserId)) {
            throw new AppException(ErrorCode.SECURITY_VIOLATION, "Ви не можете видалити цей запит", HttpStatus.FORBIDDEN);
        }

        friendshipRepository.delete(friendship);
    }

    @Transactional(readOnly = true)
    public List<FriendDto> getFriendsList() {
        Long currentUserId = getCurrentUserId();
        List<Friendship> friends = friendshipRepository.findAllFriendsByUserIdAndStatus(currentUserId, FriendshipStatus.ACCEPTED);

        return friends.stream().map(f -> {
            Long friendId = f.getRequesterId().equals(currentUserId) ? f.getReceiverId() : f.getRequesterId();
            String username = profileSocialApi.getUsernameById(friendId);
            return new FriendDto(f.getId(), username, f.getUpdatedAt());
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> getPendingRequests() {
        Long currentUserId = getCurrentUserId();
        List<Friendship> requests = friendshipRepository.findByReceiverIdAndStatus(currentUserId, FriendshipStatus.PENDING);

        return requests.stream().map(f -> {
            String username = profileSocialApi.getUsernameById(f.getRequesterId());
            return new FriendRequestDto(f.getId(), username, f.getCreatedAt());
        }).collect(Collectors.toList());
    }
}
