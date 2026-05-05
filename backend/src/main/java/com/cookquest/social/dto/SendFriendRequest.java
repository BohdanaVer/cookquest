package com.cookquest.social.dto;

import jakarta.validation.constraints.NotBlank;

public record SendFriendRequest(
        @NotBlank(message = "Юзернейм не може бути пустим")
        String targetUsername
) {}