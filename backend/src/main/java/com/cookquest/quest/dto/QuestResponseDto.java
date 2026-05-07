package com.cookquest.quest.dto;

import com.cookquest.quest.entity.QuestStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuestResponseDto {
    private Long id;
    private String recipeId;
    private String activeDate;
    private Double xpMultiplier;
    private String cuisineName;
    private QuestStatus status;
}