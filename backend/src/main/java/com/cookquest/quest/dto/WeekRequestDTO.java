package com.cookquest.quest.dto;

import java.time.LocalDate;

public record WeekRequestDTO(
        String theme,
        LocalDate startDate
) {}