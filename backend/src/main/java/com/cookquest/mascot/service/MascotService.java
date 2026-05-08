package com.cookquest.mascot.service;

import com.cookquest.auth.service.CurrentUserService;
import com.cookquest.common.ai.GroqClient;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.mascot.ai.client.StabilityApiClient;
import com.cookquest.mascot.ai.prompt.MascotPromptBuilder;
import com.cookquest.mascot.dto.MascotCatalogDto;
import com.cookquest.mascot.dto.MascotConfig;
import com.cookquest.mascot.dto.MascotImagesDto;
import com.cookquest.mascot.entity.Mascot;
import com.cookquest.mascot.entity.MascotRarity;
import com.cookquest.mascot.entity.MascotType;
import com.cookquest.mascot.entity.UserMascot;
import com.cookquest.mascot.integration.EconomyMascotApi;
import com.cookquest.mascot.integration.ProfileMascotApi;
import com.cookquest.mascot.repository.MascotRepository;
import com.cookquest.mascot.repository.UserMascotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;

@Slf4j
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
    private final GroqClient groqClient;

    @Value("${app.mascot.generation-price:2000}")
    private int generationPrice;

    public int getGenerationPrice() {
        return generationPrice;
    }

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
                m.getDescription(),
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
                .orElseThrow(() -> new AppException(ErrorCode.MASCOT_NOT_FOUND, "Маскота не знайдено", HttpStatus.NOT_FOUND));

        if (mascot.getType() != MascotType.BASE) {
            throw new AppException(ErrorCode.MASCOT_NOT_FOR_SALE, "Цей маскот не продається", HttpStatus.BAD_REQUEST);
        }

        if (userMascotRepository.existsByUserIdAndMascotId(userId, mascotId)) {
            throw new AppException(ErrorCode.MASCOT_ALREADY_OWNED, "Ви вже володієте цим маскотом", HttpStatus.BAD_REQUEST);
        }

        if (!economyMascotApi.hasEnoughCoins(userId, mascot.getPrice())) {
            throw new AppException(ErrorCode.INSUFFICIENT_COINS, "Недостатньо монет", HttpStatus.BAD_REQUEST);
        }

        economyMascotApi.deductCoins(userId, mascot.getPrice());

        UserMascot userMascot = UserMascot.builder()
                .userId(userId)
                .mascot(mascot)
                .acquiredAt(LocalDateTime.now())
                .build();
        userMascotRepository.save(userMascot);

        return new MascotCatalogDto(
                mascot.getId(),
                mascot.getName(),
                mascot.getDescription(),
                mascot.getType().name(),
                mascot.getImageUrlHappy(),
                mascot.getImageUrlNeutral(),
                mascot.getImageUrlSad(),
                mascot.getPrice(),
                true,
                false
        );
    }

    @Transactional
    public void setActiveMascot(Long mascotId) {
        Long userId = getCurrentUserId();

        if (!userMascotRepository.existsByUserIdAndMascotId(userId, mascotId)) {
            throw new AppException(ErrorCode.MASCOT_NOT_OWNED, "Ви не володієте цим маскотом", HttpStatus.FORBIDDEN);
        }

        profileMascotApi.updateActiveMascot(userId, mascotId);
    }

  /*
    @Transactional
    public MascotCatalogDto generateCustomMascot(MascotConfig config) {
        Long userId = currentUserService.getCurrentUser().getId();

        final int GENERATION_PRICE = generationPrice;

        if (!economyMascotApi.hasEnoughCoins(userId, generationPrice)) {
            throw new AppException(
                    ErrorCode.INSUFFICIENT_COINS,
                    "Недостатньо монет для генерації",
                    HttpStatus.BAD_REQUEST
            );
        }

        economyMascotApi.deductCoins(userId, generationPrice);

        try {
            String translatedSubject = groqClient.translateToEnglish(config.subject());
            String translatedExtras = groqClient.translateToEnglish(config.extraDetails());

            MascotConfig translatedConfig = new MascotConfig(
                    config.name(), config.type(), translatedSubject, config.style(),
                    config.personality(), config.color(), translatedExtras
            );

            var promptData = promptBuilder.buildPrompt(translatedConfig, null);

            log.info("ФІНАЛЬНИЙ ПРОМПТ ДЛЯ STABILITY: {}", promptData.prompt());

            byte[] generatedImage = stabilityClient.generateImage(
                    promptData.prompt(),
                    promptData.negativePrompt(),
                    promptData.stylePreset()
            );

            byte[] finalTransparentImage = stabilityClient.removeBackground(generatedImage);
            String fileName = "custom_" + java.util.UUID.randomUUID().toString();

            String cloudUrl = fileStorageService.saveImageToCloud(finalTransparentImage, "mascots", fileName);

            // Підготовка опису: беремо extraDetails, якщо пусто — пустий рядок, якщо більше 50 символів — обрізаємо
            String customDesc = config.description() != null ? config.description() : "";
            if (customDesc.length() > 50) {
                customDesc = customDesc.substring(0, 47) + "...";
            }

            Mascot mascot = Mascot.builder()
                    .name(config.name() != null && !config.name().isBlank() ? config.name() : "Кастомний Маскот")
                    .description(customDesc) // Зберігаємо опис
                    .type(MascotType.CUSTOM)
                    .rarity(MascotRarity.LEGENDARY)
                    .imageUrlHappy(cloudUrl)
                    .imageUrlNeutral(cloudUrl)
                    .imageUrlSad(cloudUrl)
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

            // Додаємо mascot.getDescription() до DTO
            return new MascotCatalogDto(
                    mascot.getId(), mascot.getName(), mascot.getDescription(), mascot.getType().name(),
                    mascot.getImageUrlHappy(), mascot.getImageUrlNeutral(), mascot.getImageUrlSad(),
                    mascot.getPrice(), true, false
            );

        } catch (Exception e) {
            log.error("Помилка генерації маскота", e);
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            throw new AppException(ErrorCode.MASCOT_GENERATION_FAILED, "Помилка генерації: " + cause.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
*/

    // TODO: ЗАМІНИТИ НА СПРАВЖНІЙ МЕТОД ПЕРЕД РЕЛІЗОМ
    @Transactional
    public MascotCatalogDto generateCustomMascot(MascotConfig config) {
        Long userId = currentUserService.getCurrentUser().getId();

        final int GENERATION_PRICE = generationPrice;

        if (!economyMascotApi.hasEnoughCoins(userId, generationPrice)) {
            throw new AppException(
                    ErrorCode.INSUFFICIENT_COINS,
                    "Недостатньо монет для генерації",
                    HttpStatus.BAD_REQUEST
            );
        }

        economyMascotApi.deductCoins(userId, generationPrice);

        log.info("Викликано MOCK-генерацію маскота для юзера {}. ШІ та Cloudinary вимкнено.", userId);

        try {
            Thread.sleep(3000);

            String mockCloudUrl = "https://res.cloudinary.com/dhw5at0ia/image/upload/v1778081614/mascots/custom_d9e8459c-7c85-410d-ae6f-a4c8efd693dd.png";

            String customDesc = config.description() != null ? config.description() : "";
            if (customDesc.length() > 50) {
                customDesc = customDesc.substring(0, 47) + "...";
            }

            Mascot mascot = Mascot.builder()
                    .name(config.name() != null && !config.name().isBlank()
                            ? config.name()
                            : "Кастомний Маскот (Mock)")
                    .description(customDesc)
                    .type(MascotType.CUSTOM)
                    .rarity(MascotRarity.LEGENDARY)
                    .imageUrlHappy(mockCloudUrl)
                    .imageUrlNeutral(mockCloudUrl)
                    .imageUrlSad(mockCloudUrl)
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

            log.info("Mock-маскот успішно доданий в інвентар юзера з ID: {}", mascot.getId());

            return new MascotCatalogDto(
                    mascot.getId(), mascot.getName(), mascot.getDescription(), mascot.getType().name(),
                    mascot.getImageUrlHappy(), mascot.getImageUrlNeutral(), mascot.getImageUrlSad(),
                    mascot.getPrice(), true, false
            );

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Перервано очікування MOCK-генерації", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.error("Помилка генерації маскота", e);
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            throw new AppException(ErrorCode.MASCOT_GENERATION_FAILED, "Помилка генерації: " + cause.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(readOnly = true)
    public java.util.Map<Long, String> getMascotHappyImagesMap(java.util.List<Long> mascotIds) {
        if (mascotIds == null || mascotIds.isEmpty()) {
            return new java.util.HashMap<>();
        }
        return mascotRepository.findAllById(mascotIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        Mascot::getId,
                        Mascot::getImageUrlHappy
                ));
    }

    @Transactional(readOnly = true)
    public MascotImagesDto getMascotImages(Long mascotId) {
        if (mascotId == null) return null;

        return mascotRepository.findById(mascotId)
                .map(m -> new MascotImagesDto(
                        m.getImageUrlHappy(),
                        m.getImageUrlNeutral(),
                        m.getImageUrlSad()
                ))
                .orElse(null);
    }
}