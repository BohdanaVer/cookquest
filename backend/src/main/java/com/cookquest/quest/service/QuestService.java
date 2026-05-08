package com.cookquest.quest.service;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.quest.dto.QuestRequestDto;
import com.cookquest.quest.dto.QuestResponseDto;
import com.cookquest.quest.dto.WeekRequestDto;
import com.cookquest.quest.entity.*;
import com.cookquest.quest.repository.CompletedQuestRepository;
import com.cookquest.quest.repository.DayRepository;
import com.cookquest.quest.repository.QuestRepository;
import com.cookquest.quest.repository.WeekRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuestService {

    private final QuestRepository questRepository;
    private final CompletedQuestRepository completedQuestRepository;
    private final DayRepository dayRepository;
    private final WeekRepository weekRepository;


    @Transactional(readOnly = true)
    public List<Week> getAllWeeks() {
        return weekRepository.findAll();
    }

    @Transactional
    public Week createWeek(WeekRequestDto request) {
        LocalDate startDate = request.startDate();

        if (startDate.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new AppException(ErrorCode.INVALID_WEEK_START_DATE, "Дата початку тижня має бути виключно понеділком!", HttpStatus.BAD_REQUEST);
        }

        Week week = Week.builder()
                .theme(request.theme())
                .startDate(startDate)
                .endDate(startDate.plusDays(6))
                .build();

        List<Day> days = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate currentDate = startDate.plusDays(i);
            Day day = Day.builder()
                    .week(week)
                    .date(currentDate)
                    .dayOfWeek(currentDate.getDayOfWeek())
                    .build();
            days.add(day);
        }

        week.setDays(days);
        return weekRepository.save(week);
    }


    @Transactional
    public Quest createQuest(QuestRequestDto request) {
        Day day = dayRepository.findById(request.dayId())
                .orElseThrow(() -> new AppException(ErrorCode.DAY_NOT_FOUND, "День не знайдено з id: " + request.dayId(), HttpStatus.NOT_FOUND));

        Quest quest = Quest.builder()
                .recipeId(request.recipeId())
                .day(day)
                .xpMultiplier(request.xpMultiplier() != null ? request.xpMultiplier() : 1.0)
                .cuisineName(request.cuisineName())
                .build();

        return questRepository.save(quest);
    }

    @Transactional
    public Quest updateQuest(Long id, QuestRequestDto request) {
        Quest quest = questRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUEST_NOT_FOUND, "Квест не знайдено з id: " + id, HttpStatus.NOT_FOUND));

        Day day = dayRepository.findById(request.dayId())
                .orElseThrow(() -> new AppException(ErrorCode.DAY_NOT_FOUND, "День не знайдено з id: " + request.dayId(), HttpStatus.NOT_FOUND));

        quest.setRecipeId(request.recipeId());
        quest.setXpMultiplier(request.xpMultiplier() != null ? request.xpMultiplier() : 1.0);
        quest.setCuisineName(request.cuisineName());
        quest.setDay(day);

        return questRepository.save(quest);
    }

    @Transactional
    public void deleteQuest(Long id) {
        if (!questRepository.existsById(id)) {
            throw new AppException(ErrorCode.QUEST_NOT_FOUND, "Квест не знайдено з id: " + id, HttpStatus.NOT_FOUND);
        }
        questRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Quest> getAllQuestsForAdmin() {
        return questRepository.findAll();
    }


    @Transactional(readOnly = true)
    public boolean isQuestActiveToday(String recipeId) {
        return questRepository.findByRecipeIdAndDayDate(recipeId, LocalDate.now()).isPresent();
    }

    @Transactional(readOnly = true)
    public boolean isQuestCompletedByUser(Long userId, String recipeId) {
        Optional<Quest> todayQuestOpt = questRepository.findByRecipeIdAndDayDate(recipeId, LocalDate.now());
        if (todayQuestOpt.isEmpty()) {
            return false;
        }

        return completedQuestRepository.findByUserIdAndQuestId(userId, todayQuestOpt.get().getId())
                .map(cq -> cq.getCompletedAt() != null)
                .orElse(false);
    }

    @Transactional
    public void startQuestProgress(Long userId, String recipeId) {
        Optional<Quest> todayQuestOpt = questRepository.findByRecipeIdAndDayDate(recipeId, LocalDate.now());
        if (todayQuestOpt.isEmpty()) return;

        Quest todayQuest = todayQuestOpt.get();

        if (!completedQuestRepository.existsByUserIdAndQuestId(userId, todayQuest.getId())) {
            completedQuestRepository.save(
                    CompletedQuest.builder()
                            .userId(userId)
                            .quest(todayQuest)
                            .startedAt(LocalDateTime.now())
                            .build()
            );
        }
    }

    @Transactional(readOnly = true)
    public Double getQuestMultiplier(String recipeId) {
        Optional<Quest> todayQuestOpt = questRepository.findByRecipeIdAndDayDate(recipeId, LocalDate.now());
        return todayQuestOpt.map(Quest::getXpMultiplier).orElse(1.0);
    }

    @Transactional
    public void markQuestCompleted(Long userId, String recipeId, LocalDateTime startedAt) {
        Optional<Quest> todayQuestOpt = questRepository.findByRecipeIdAndDayDate(recipeId, LocalDate.now());

        if (todayQuestOpt.isEmpty()) {
            return;
        }
        Quest todayQuest = todayQuestOpt.get();

        Optional<CompletedQuest> cqOpt = completedQuestRepository.findByUserIdAndQuestId(userId, todayQuest.getId());

        if (cqOpt.isPresent()) {
            CompletedQuest cq = cqOpt.get();
            if (cq.getCompletedAt() == null) {
                cq.setCompletedAt(LocalDateTime.now());
                completedQuestRepository.save(cq);
            }
        } else {

            completedQuestRepository.save(
                    CompletedQuest.builder()
                            .userId(userId)
                            .quest(todayQuest)
                            .startedAt(startedAt)
                            .completedAt(LocalDateTime.now())
                            .build()
            );
        }
    }

    @Transactional(readOnly = true)
    public List<QuestResponseDto> getQuestsForUser(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        List<Quest> weekQuests = questRepository.findAllByDayDateBetween(startOfWeek, endOfWeek);

        return weekQuests.stream().map(quest -> {
            LocalDate questDate = quest.getDay().getDate();
            boolean isCompleted = isQuestCompletedByUser(userId, quest.getRecipeId());

            QuestStatus currentStatus;

            if (questDate.isAfter(today)) {
                currentStatus = QuestStatus.LOCKED;
            } else if (isCompleted) {
                currentStatus = QuestStatus.COMPLETED;
            } else {
                currentStatus = QuestStatus.AVAILABLE;
            }

            return QuestResponseDto.builder()
                    .id(quest.getId())
                    .recipeId(quest.getRecipeId())
                    .activeDate(questDate.toString())
                    .xpMultiplier(quest.getXpMultiplier())
                    .cuisineName(quest.getCuisineName())
                    .status(currentStatus)
                    .build();
        }).toList();
    }
}