package com.cookquest.auth.integration.impl;

import com.cookquest.auth.entity.User;
import com.cookquest.auth.repository.UserRepository;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.mascot.service.MascotService;
import com.cookquest.profile.entity.UserProfile;
import com.cookquest.profile.repository.UserProfileRepository;
import com.cookquest.social.dto.SocialProfileInfoDto;
import com.cookquest.social.dto.UserSearchDto;
import com.cookquest.social.integration.ProfileSocialApi;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileSocialApiImpl implements ProfileSocialApi {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final MascotService mascotService;

    @Override
    public Long getUserIdByUsername(String username) {
        try {
            Optional<User> userOptional = userRepository.findByUsername(username);
            return userOptional.map(User::getId).orElse(null);
        } catch (IncorrectResultSizeDataAccessException e) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    "Існує декілька акаунтів з іменем '" + username + "'. Зверніться до підтримки.",
                    HttpStatus.CONFLICT
            );
        }
    }

    @Override
    public String getUsernameById(Long userId) {
        return userRepository.findById(userId)
                .map(User::getUsername)
                .orElse("Unknown");
    }

    @Override
    public SocialProfileInfoDto getSocialProfileInfo(Long userId) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Профіль не знайдено", HttpStatus.NOT_FOUND));

        String mascotUrl = null;
        if (profile.getActiveMascotId() != null) {
            var images = mascotService.getMascotImages(profile.getActiveMascotId());
            if (images != null) {
                mascotUrl = images.happyUrl();
            }
        }

        return new SocialProfileInfoDto(
                userId,
                profile.getUser().getUsername(),
                profile.getLevel() != null ? profile.getLevel().getLevelNumber() : 1,
                mascotUrl
        );
    }

    @Override
    public List<UserSearchDto> searchUsers(String query, Long currentUserId) {
        // Шукаємо юзерів за частковим співпадінням імені (без урахування регістру), виключаючи себе
        List<UserProfile> profiles = profileRepository.findByUserUsernameContainingIgnoreCaseAndIdNot(query, currentUserId);
        return mapToSearchDtos(profiles);
    }

    @Override
    public List<UserSearchDto> getRandomSuggestions(int limit, List<Long> excludedUserIds) {
        // Щоб SQL запит не впав через порожній список IN (), додаємо туди неіснуючий ID, якщо список порожній
        if (excludedUserIds == null || excludedUserIds.isEmpty()) {
            excludedUserIds = List.of(-1L);
        }

        List<UserProfile> profiles = profileRepository.findRandomProfilesExcluding(excludedUserIds, limit);
        return mapToSearchDtos(profiles);
    }

    // =========================================
    // ДОПОМІЖНИЙ МЕТОД ДЛЯ ОПТИМІЗАЦІЇ (N+1)
    // =========================================
    private List<UserSearchDto> mapToSearchDtos(List<UserProfile> profiles) {
        // Збираємо всі унікальні ID маскотів
        List<Long> mascotIds = profiles.stream()
                .map(UserProfile::getActiveMascotId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        // Робимо один швидкий запит за картинками
        Map<Long, String> mascotImageMap = mascotService.getMascotHappyImagesMap(mascotIds);

        // Формуємо фінальний список
        return profiles.stream().map(p -> {
            String imageUrl = p.getActiveMascotId() != null ? mascotImageMap.get(p.getActiveMascotId()) : null;
            return new UserSearchDto(
                    p.getId(),
                    p.getUser().getUsername(),
                    p.getLevel() != null ? p.getLevel().getLevelNumber() : 1,
                    imageUrl
            );
        }).toList();
    }
}