package com.cookquest.social.service;

import com.cookquest.auth.service.CurrentUserService;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.social.dto.FriendDto;
import com.cookquest.social.dto.FriendRequestDto;
import com.cookquest.social.dto.SocialProfileInfoDto;
import com.cookquest.social.dto.UserSearchDto;
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
            throw new AppException(ErrorCode.USER_NOT_FOUND, "Користувача не знайдено", HttpStatus.NOT_FOUND);
        }

        if (currentUserId.equals(targetUserId)) {
            throw new AppException(ErrorCode.CANNOT_ADD_SELF, "Не можна додати самого себе", HttpStatus.BAD_REQUEST);
        }

        if (friendshipRepository.existsByUsers(currentUserId, targetUserId)) {
            throw new AppException(ErrorCode.FRIENDSHIP_ALREADY_EXISTS, "Запит або дружба вже існує", HttpStatus.BAD_REQUEST);
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
                .orElseThrow(() -> new AppException(ErrorCode.FRIEND_REQUEST_NOT_FOUND, "Запит не знайдено", HttpStatus.NOT_FOUND));

        if (!friendship.getReceiverId().equals(currentUserId)) {
            throw new AppException(ErrorCode.NOT_REQUEST_RECEIVER, "Ви не можете прийняти чужий запит", HttpStatus.FORBIDDEN);
        }

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new AppException(ErrorCode.FRIEND_REQUEST_ALREADY_PROCESSED, "Запит вже оброблено", HttpStatus.BAD_REQUEST);
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        return friendshipRepository.save(friendship); // updatedAt оновиться автоматично, це і буде friendSince
    }

    @Transactional
    public void declineRequest(Long friendshipId) {
        Long currentUserId = getCurrentUserId();
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new AppException(ErrorCode.FRIEND_REQUEST_NOT_FOUND, "Запит не знайдено", HttpStatus.NOT_FOUND));

        if (!friendship.getReceiverId().equals(currentUserId) && !friendship.getRequesterId().equals(currentUserId)) {
            throw new AppException(ErrorCode.NOT_INVOLVED_IN_REQUEST, "Ви не можете видалити цей запит, оскільки не є його учасником", HttpStatus.FORBIDDEN);
        }

        friendshipRepository.delete(friendship);
    }

    @Transactional(readOnly = true)
    public List<FriendDto> getFriendsList() {
        Long currentUserId = getCurrentUserId();
        List<Friendship> friends = friendshipRepository.findAllFriendsByUserIdAndStatus(currentUserId, FriendshipStatus.ACCEPTED);

        return friends.stream().map(f -> {
            Long friendId = f.getRequesterId().equals(currentUserId) ? f.getReceiverId() : f.getRequesterId();
            SocialProfileInfoDto info = profileSocialApi.getSocialProfileInfo(friendId);

            return new FriendDto(
                    f.getId(),
                    info.username(),
                    f.getUpdatedAt(),
                    info.levelNumber(),
                    info.mascotImageUrl()
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> getPendingRequests() {
        Long currentUserId = getCurrentUserId();
        List<Friendship> requests = friendshipRepository.findByReceiverIdAndStatus(currentUserId, FriendshipStatus.PENDING);

        return requests.stream().map(f -> {
            SocialProfileInfoDto info = profileSocialApi.getSocialProfileInfo(f.getRequesterId());

            return new FriendRequestDto(
                    f.getId(),
                    info.username(),
                    info.mascotImageUrl(),
                    f.getCreatedAt()
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSearchDto> searchUsers(String query) {
        Long currentUserId = getCurrentUserId();
        return profileSocialApi.searchUsers(query, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<UserSearchDto> getSuggestions(int limit) {
        Long currentUserId = getCurrentUserId();

        List<Friendship> connections = friendshipRepository.findByRequesterIdOrReceiverId(currentUserId, currentUserId);
        List<Long> excludedIds = connections.stream()
                .map(f -> f.getRequesterId().equals(currentUserId) ? f.getReceiverId() : f.getRequesterId())
                .collect(Collectors.toList());

        excludedIds.add(currentUserId);

        return profileSocialApi.getRandomSuggestions(limit, excludedIds);
    }
}