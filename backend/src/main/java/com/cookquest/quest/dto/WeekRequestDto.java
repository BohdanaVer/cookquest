package com.cookquest.quest.dto;

import java.time.LocalDate;

public record WeekRequestDto(
        String theme,
        LocalDate startDate
) {}