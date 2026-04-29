package com.cookquest.quest.service;

import com.cookquest.auth.entity.User;
import com.cookquest.quest.dto.QuestRequestDTO;
import com.cookquest.quest.dto.WeekRequestDTO;
import com.cookquest.quest.entity.CompletedQuest;
import com.cookquest.quest.entity.Day;
import com.cookquest.quest.entity.Quest;
import com.cookquest.quest.entity.Week;
import com.cookquest.quest.repository.CompletedQuestRepository;
import com.cookquest.quest.repository.DayRepository;
import com.cookquest.quest.repository.QuestRepository;
import com.cookquest.quest.repository.WeekRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    public Week createWeek(WeekRequestDTO request) {
        LocalDate startDate = request.startDate();

        if (startDate.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new RuntimeException("Дата початку тижня має бути виключно понеділком!");
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
    public Quest createQuest(QuestRequestDTO request) {
        Day day = dayRepository.findById(request.dayId())
                .orElseThrow(() -> new RuntimeException("День не знайдено з id: " + request.dayId()));

        Quest quest = Quest.builder()
                .recipeId(request.recipeId())
                .day(day)
                .xpMultiplier(request.xpMultiplier() != null ? request.xpMultiplier() : 1.0)
                .cuisineName(request.cuisineName())
                .build();

        return questRepository.save(quest);
    }

    @Transactional
    public Quest updateQuest(Long id, QuestRequestDTO request) {
        Quest quest = questRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Квест не знайдено з id: " + id));

        Day day = dayRepository.findById(request.dayId())
                .orElseThrow(() -> new RuntimeException("День не знайдено з id: " + request.dayId()));

        quest.setRecipeId(request.recipeId());
        quest.setXpMultiplier(request.xpMultiplier() != null ? request.xpMultiplier() : 1.0);
        quest.setCuisineName(request.cuisineName());

        return questRepository.save(quest);
    }

    @Transactional
    public void deleteQuest(Long id) {
        if (!questRepository.existsById(id)) {
            throw new RuntimeException("Квест не знайдено з id: " + id);
        }
        questRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Quest> getAllQuestsForAdmin() {
        return questRepository.findAll();
    }


    @Transactional(readOnly = true)
    public boolean isQuestAvailableTodayForRecipe(String recipeId) {
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
    public void startQuestProgress(User user, String recipeId) {
        Optional<Quest> todayQuestOpt = questRepository.findByRecipeIdAndDayDate(recipeId, LocalDate.now());
        if (todayQuestOpt.isEmpty()) return;

        Quest todayQuest = todayQuestOpt.get();

        if (!completedQuestRepository.existsByUserIdAndQuestId(user.getId(), todayQuest.getId())) {
            completedQuestRepository.save(
                    CompletedQuest.builder()
                            .user(user)
                            .quest(todayQuest)
                            .startedAt(LocalDateTime.now())
                            .build()
            );
        }
    }

    @Transactional
    public double completeQuestAndGetMultiplier(User user, String recipeId, LocalDateTime sessionStartedAt) {
        Optional<Quest> todayQuestOpt = questRepository.findByRecipeIdAndDayDate(recipeId, LocalDate.now());
        if (todayQuestOpt.isEmpty()) {
            return 1.0;
        }

        Quest todayQuest = todayQuestOpt.get();
        Optional<CompletedQuest> cqOpt = completedQuestRepository.findByUserIdAndQuestId(user.getId(), todayQuest.getId());

        if (cqOpt.isPresent()) {
            CompletedQuest cq = cqOpt.get();
            if (cq.getCompletedAt() != null) {
                return 1.0;
            }
            cq.setCompletedAt(LocalDateTime.now());
            completedQuestRepository.save(cq);
            return todayQuest.getXpMultiplier();
        } else {
            completedQuestRepository.save(
                    CompletedQuest.builder()
                            .user(user)
                            .quest(todayQuest)
                            .startedAt(sessionStartedAt)
                            .completedAt(LocalDateTime.now())
                            .build()
            );
            return todayQuest.getXpMultiplier();
        }
    }
}