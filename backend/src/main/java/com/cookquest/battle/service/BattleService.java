package com.cookquest.battle.service;

import com.cookquest.auth.service.CurrentUserService;
import com.cookquest.battle.dto.BattleResponse;
import com.cookquest.battle.dto.RecipePreviewDto;
import com.cookquest.battle.entity.Battle;
import com.cookquest.battle.entity.BattleParticipant;
import com.cookquest.battle.entity.BattleStatus;
import com.cookquest.battle.integration.CookingBattleApi;
import com.cookquest.battle.integration.EconomyBattleApi;
import com.cookquest.battle.integration.RecipeBattleApi;
import com.cookquest.battle.integration.UserBattleApi;
import com.cookquest.battle.dto.CreateBattleRequest;
import com.cookquest.battle.repository.BattleParticipantRepository;
import com.cookquest.battle.repository.BattleRepository;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.cooking.dto.CookingSessionDto;
import com.cookquest.cooking.integration.event.CookingSessionCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BattleService {

    private final BattleRepository battleRepository;
    private final BattleParticipantRepository participantRepository;
    private final BattleEvaluationService evaluationService;

    private final RecipeBattleApi recipeBattleApi;
    private final CookingBattleApi cookingBattleApi;
    private final EconomyBattleApi economyBattleApi;
    private final UserBattleApi userBattleApi;
    private final CurrentUserService currentUserService;

    private Long getCurrentUserId() {
        return currentUserService.getCurrentUser().getId();
    }

    @Transactional
    public BattleResponse createBattle(CreateBattleRequest request) {
        Long currentUserId = getCurrentUserId();

        Long targetUserId = userBattleApi.getUserIdByUsername(request.targetUsername());

        if (targetUserId == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Користувача з іменем " + request.targetUsername() + " не знайдено", HttpStatus.NOT_FOUND);
        }

        if (currentUserId.equals(targetUserId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Ви не можете викликати на батл самого себе",
                    HttpStatus.BAD_REQUEST);
        }

        if (!recipeBattleApi.isRecipeValidForBattle(request.recipeId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Цей рецепт не можна використати для батлу",
                    HttpStatus.BAD_REQUEST);
        }

        if (cookingBattleApi.isRecipeAlreadyUsed(currentUserId, request.recipeId())) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    "Цей рецепт вже був використаний! Будь ласка, згенеруйте новий для створення батлу.",
                    HttpStatus.BAD_REQUEST);
        }

        int basePoints = recipeBattleApi.getBasePoints(request.recipeId());
        int xpPool = (int) (basePoints * 2.4);

        Battle battle = Battle.builder()
                .recipeId(request.recipeId())
                .status(BattleStatus.WAITING_FOR_OPPONENT)
                .totalXpPool(xpPool)
                .createdAt(LocalDateTime.now())
                .build();
        battle = battleRepository.save(battle);

        Long session1 = cookingBattleApi.startBattleCookingSession(currentUserId, request.recipeId());
        BattleParticipant p1 = BattleParticipant.builder()
                .battle(battle)
                .userId(currentUserId)
                .cookingSessionId(session1)
                .isFinished(false)
                .build();
        participantRepository.save(p1);

        BattleParticipant p2 = BattleParticipant.builder()
                .battle(battle)
                .userId(targetUserId)
                .cookingSessionId(null)
                .isFinished(false)
                .build();
        participantRepository.save(p2);

        return mapToResponse(battle);
    }

    @Transactional
    public BattleResponse acceptBattle(Long battleId) {
        Long currentUserId = getCurrentUserId();
        Battle battle = battleRepository.findById(battleId)
                .orElseThrow(
                        () -> new AppException(ErrorCode.INVALID_REQUEST, "Батл не знайдено", HttpStatus.NOT_FOUND));

        if (battle.getStatus() != BattleStatus.WAITING_FOR_OPPONENT && battle.getStatus() != BattleStatus.JUDGING) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Цей батл вже неможливо прийняти",
                    HttpStatus.BAD_REQUEST);
        }

        BattleParticipant me = participantRepository.findByBattleIdAndUserId(battleId, currentUserId);
        if (me == null) {
            throw new AppException(ErrorCode.SECURITY_VIOLATION, "Ви не є учасником цього батлу", HttpStatus.FORBIDDEN);
        }

        if (me.getCookingSessionId() != null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Ви вже прийняли цей батл", HttpStatus.BAD_REQUEST);
        }

        Long newSessionId = cookingBattleApi.startBattleCookingSession(currentUserId, battle.getRecipeId());
        me.setCookingSessionId(newSessionId);
        participantRepository.save(me);

        if (battle.getStatus() == BattleStatus.WAITING_FOR_OPPONENT) {
            battle.setStatus(BattleStatus.ACTIVE);
            battle.setStartedAt(LocalDateTime.now());
            battleRepository.save(battle);
        }

        return mapToResponse(battle);
    }

    @Transactional
    public BattleResponse submitParticipant(Long battleId) {
        return submitParticipantInternal(battleId, getCurrentUserId());
    }

    @EventListener
    @Transactional
    public void onCookingSessionCompleted(CookingSessionCompletedEvent event) {
        BattleParticipant participant = participantRepository.findByCookingSessionId(event.sessionId());

        if (participant == null || participant.isFinished()) {
            return;
        }

        log.info("Отримано сигнал від Cooking: сесія {} завершена. Автоматично здаємо батл {}",
                event.sessionId(), participant.getBattle().getId());

        submitParticipantInternal(participant.getBattle().getId(), event.userId());
    }

    @Transactional
    protected BattleResponse submitParticipantInternal(Long battleId, Long userId) {
        Battle battle = battleRepository.findById(battleId)
                .orElseThrow(
                        () -> new AppException(ErrorCode.INVALID_REQUEST, "Батл не знайдено", HttpStatus.NOT_FOUND));

        if (battle.getStatus() == BattleStatus.COMPLETED || battle.getStatus() == BattleStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Цей батл вже завершено", HttpStatus.BAD_REQUEST);
        }

        BattleParticipant player = participantRepository.findByBattleIdAndUserId(battleId, userId);
        if (player == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Учасника не знайдено", HttpStatus.NOT_FOUND);
        }

        if (player.isFinished()) {
            return mapToResponse(battle);
        }

        Long sessionId = player.getCookingSessionId();

        if (cookingBattleApi.isSessionCancelled(sessionId)) {
            player.setQualityScore(0);
            player.setSpeedScore(0);
            player.setTotalScore(0);
        } else {
            int qualityScore = cookingBattleApi.getAiQualityScore(sessionId);
            int timeSpent = cookingBattleApi.getCookingTimeSpentMinutes(sessionId);
            int refTime = recipeBattleApi.getCookingTimeMinutes(battle.getRecipeId());

            player.setQualityScore(qualityScore);

            int speedScore = timeSpent <= refTime ? 100 : Math.max(0, 100 - (timeSpent - refTime));
            player.setSpeedScore(speedScore);

            player.setTotalScore((int) (qualityScore * 0.6 + speedScore * 0.4));
        }

        player.setFinished(true);
        participantRepository.save(player);

        List<BattleParticipant> participants = participantRepository.findByBattleId(battleId);
        boolean allFinished = participants.stream().allMatch(BattleParticipant::isFinished);

        if (allFinished) {
            BattleParticipant p1 = participants.get(0);
            BattleParticipant p2 = participants.get(1);
            int refTime = recipeBattleApi.getCookingTimeMinutes(battle.getRecipeId());

            evaluationService.evaluateBattle(battle, p1, p2, refTime);

            participantRepository.save(p1);
            participantRepository.save(p2);
            battleRepository.save(battle);

            if (battle.getStatus() == BattleStatus.COMPLETED) {
                economyBattleApi.awardBattleResults(p1.getUserId(), p1.getEarnedXp(), p1.getEarnedCoins());
                economyBattleApi.awardBattleResults(p2.getUserId(), p2.getEarnedXp(), p2.getEarnedCoins());
            }
        } else {
            battle.setStatus(BattleStatus.JUDGING);
            battleRepository.save(battle);
        }

        return mapToResponse(battle);
    }

    public Battle getBattle(Long battleId) {
        return battleRepository.findById(battleId)
                .orElseThrow(
                        () -> new AppException(ErrorCode.INVALID_REQUEST, "Батл не знайдено", HttpStatus.NOT_FOUND));
    }

    public List<BattleResponse> getActiveBattles() {
        Long userId = getCurrentUserId();
        List<BattleStatus> activeStatuses = List.of(
                BattleStatus.WAITING_FOR_OPPONENT,
                BattleStatus.ACTIVE,
                BattleStatus.JUDGING);
        List<Battle> battles = battleRepository.findActiveBattlesByUserId(userId, activeStatuses);
        return battles.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<BattleResponse> getBattleHistory() {
        Long userId = getCurrentUserId();
        List<BattleStatus> historyStatuses = List.of(
                BattleStatus.COMPLETED,
                BattleStatus.CANCELLED);
        List<Battle> battles = battleRepository.findBattlesByUserIdAndStatuses(userId, historyStatuses);

        return battles.stream().map(this::mapToResponse).toList();
    }

    public BattleResponse getBattleStatus(Long battleId) {
        return mapToResponse(getBattle(battleId));
    }

    @Transactional
    public BattleResponse cancelParticipation(Long battleId) {
        Long userId = getCurrentUserId();
        Battle battle = getBattle(battleId);
        BattleParticipant player = participantRepository.findByBattleIdAndUserId(battleId, userId);

        if (player == null) {
            throw new AppException(ErrorCode.SECURITY_VIOLATION, "Ви не є учасником цього батлу", HttpStatus.FORBIDDEN);
        }

        if (player.isFinished()) {
            return mapToResponse(battle);
        }

        player.setQualityScore(0);
        player.setSpeedScore(0);
        player.setTotalScore(0);
        player.setFinished(true);
        participantRepository.save(player);

        List<BattleParticipant> participants = participantRepository.findByBattleId(battleId);
        boolean allFinished = participants.stream().allMatch(BattleParticipant::isFinished);

        if (allFinished) {
            BattleParticipant p1 = participants.get(0);
            BattleParticipant p2 = participants.get(1);
            int refTime = recipeBattleApi.getCookingTimeMinutes(battle.getRecipeId());

            evaluationService.evaluateBattle(battle, p1, p2, refTime);

            participantRepository.save(p1);
            participantRepository.save(p2);
            battleRepository.save(battle);

            if (battle.getStatus() == BattleStatus.COMPLETED) {
                economyBattleApi.awardBattleResults(p1.getUserId(), p1.getEarnedXp(), p1.getEarnedCoins());
                economyBattleApi.awardBattleResults(p2.getUserId(), p2.getEarnedXp(), p2.getEarnedCoins());
            }
        } else {
            battle.setStatus(BattleStatus.JUDGING);
            battleRepository.save(battle);
        }

        return mapToResponse(battle);
    }

    private BattleResponse mapToResponse(Battle battle) {
        Long currentUserId = getCurrentUserId();
        boolean isCompleted = battle.getStatus() == BattleStatus.COMPLETED;

        List<BattleParticipant> participants = participantRepository.findByBattleId(battle.getId());

        BattleParticipant me = participants.stream()
                .filter(p -> p.getUserId().equals(currentUserId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Ви не є учасником цього батлу",
                        HttpStatus.FORBIDDEN));

        BattleParticipant opponent = participants.stream()
                .filter(p -> !p.getUserId().equals(currentUserId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Суперника не знайдено",
                        HttpStatus.INTERNAL_SERVER_ERROR));

        CookingSessionDto mySessionDto = null;
        if (me.getCookingSessionId() != null) {
            mySessionDto = cookingBattleApi.getSessionDetails(me.getCookingSessionId());
        }

        String opponentName = userBattleApi.getUsernameById(opponent.getUserId());

        RecipePreviewDto previewDto = recipeBattleApi.getRecipePreview(battle.getRecipeId());

        return new BattleResponse(
                battle.getId(),
                battle.getStatus().name(),

                previewDto,

                mySessionDto,
                me.isFinished() ? me.getQualityScore() : null,
                me.isFinished() ? me.getSpeedScore() : null,
                me.isFinished() ? me.getTotalScore() : null,

                opponentName,
                opponent.isFinished(),
                isCompleted ? opponent.getTotalScore() : null,

                isCompleted ? battle.getWinnerId() : null,
                isCompleted ? me.getEarnedXp() : null,
                isCompleted ? me.getEarnedCoins() : null);
    }
}
