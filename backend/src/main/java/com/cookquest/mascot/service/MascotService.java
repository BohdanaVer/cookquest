package com.cookquest.mascot.service;

import com.cookquest.auth.service.CurrentUserService;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.mascot.ai.client.StabilityApiClient;
import com.cookquest.mascot.ai.prompt.MascotPromptBuilder;
import com.cookquest.mascot.dto.MascotCatalogDto;
import com.cookquest.mascot.dto.MascotConfig;
import com.cookquest.mascot.entity.Mascot;
import com.cookquest.mascot.entity.MascotType;
import com.cookquest.mascot.entity.UserMascot;
import com.cookquest.mascot.integration.EconomyMascotApi;
import com.cookquest.mascot.integration.ProfileMascotApi;
import com.cookquest.mascot.repository.MascotRepository;
import com.cookquest.mascot.repository.UserMascotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MascotService {

    private final MascotPromptBuilder promptBuilder;
    private final StabilityApiClient stabilityClient;
    private final MascotRepository mascotRepository;
    private final UserMascotRepository userMascotRepository;
    private final EconomyMascotApi economyMascotApi;
    private final ProfileMascotApi profileMascotApi;
    private final CurrentUserService currentUserService;
    private final FileStorageService fileStorageService;

    private Long getCurrentUserId() {
        return currentUserService.getCurrentUser().getId();
    }

    @Transactional(readOnly = true)
    public List<MascotCatalogDto> getCatalog() {
        Long userId = getCurrentUserId();
        
        List<Mascot> visibleMascots = mascotRepository.findBaseAndUserCustomMascots(MascotType.BASE, MascotType.CUSTOM, userId);
        
        List<Long> ownedMascotIds = userMascotRepository.findByUserId(userId).stream()
                .map(um -> um.getMascot().getId())
                .toList();
                
        Long activeMascotId = profileMascotApi.getActiveMascot(userId);

        return visibleMascots.stream().map(m -> new MascotCatalogDto(
                m.getId(),
                m.getName(),
                m.getType().name(),
                m.getImageUrlHappy(),
                m.getImageUrlNeutral(),
                m.getImageUrlSad(),
                m.getPrice(),
                ownedMascotIds.contains(m.getId()),
                m.getId().equals(activeMascotId)
        )).collect(Collectors.toList());
    }

    @Transactional
    public MascotCatalogDto buyMascot(Long mascotId) {
        Long userId = getCurrentUserId();
        Mascot mascot = mascotRepository.findById(mascotId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Маскота не знайдено", HttpStatus.NOT_FOUND));

        if (mascot.getType() != MascotType.BASE) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Цей маскот не продається", HttpStatus.BAD_REQUEST);
        }

        if (userMascotRepository.existsByUserIdAndMascotId(userId, mascotId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Ви вже володієте цим маскотом", HttpStatus.BAD_REQUEST);
        }

        if (!economyMascotApi.hasEnoughCoins(userId, mascot.getPrice())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Недостатньо монет", HttpStatus.BAD_REQUEST);
        }

        economyMascotApi.deductCoins(userId, mascot.getPrice());

        UserMascot userMascot = UserMascot.builder()
                .userId(userId)
                .mascot(mascot)
                .acquiredAt(LocalDateTime.now())
                .build();
        userMascotRepository.save(userMascot);

        return new MascotCatalogDto(
                mascot.getId(), mascot.getName(), mascot.getType().name(),
                mascot.getImageUrlHappy(), mascot.getImageUrlNeutral(), mascot.getImageUrlSad(),
                mascot.getPrice(), true, false
        );
    }

    @Transactional
    public void setActiveMascot(Long mascotId) {
        Long userId = getCurrentUserId();
        
        if (!userMascotRepository.existsByUserIdAndMascotId(userId, mascotId)) {
            throw new AppException(ErrorCode.SECURITY_VIOLATION, "Ви не володієте цим маскотом", HttpStatus.FORBIDDEN);
        }

        profileMascotApi.updateActiveMascot(userId, mascotId);
    }

    @Transactional
    public MascotCatalogDto generateCustomMascot(MascotConfig config) {
        try {
            Long userId = getCurrentUserId();

            var promptData = promptBuilder.buildPrompt(config);

            byte[] generatedImage = stabilityClient.generateImage(
                    promptData.prompt(),
                    promptData.negativePrompt(),
                    promptData.stylePreset()
            );

            byte[] finalTransparentImage = stabilityClient.removeBackground(generatedImage);

            String base64Str = Base64.getEncoder().encodeToString(finalTransparentImage);
            String dataUrl = "data:image/png;base64," + base64Str;
            
            // Зберігаємо як файл
            String fileUrl = fileStorageService.saveBase64Image(dataUrl);

            Mascot mascot = Mascot.builder()
                    .name(config.subjectName() != null ? config.subjectName() : "Кастомний Маскот")
                    .type(MascotType.CUSTOM)
                    .imageUrlHappy(fileUrl)
                    .imageUrlNeutral(fileUrl)
                    .imageUrlSad(fileUrl)
                    .price(0)
                    .creatorId(userId)
                    .build();
            
            mascot = mascotRepository.save(mascot);

            UserMascot userMascot = UserMascot.builder()
                    .userId(userId)
                    .mascot(mascot)
                    .acquiredAt(LocalDateTime.now())
                    .build();
            userMascotRepository.save(userMascot);

            return new MascotCatalogDto(
                    mascot.getId(), mascot.getName(), mascot.getType().name(),
                    mascot.getImageUrlHappy(), mascot.getImageUrlNeutral(), mascot.getImageUrlSad(),
                    mascot.getPrice(), true, false
            );

        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Помилка генерації: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}