package com.cookquest.profile.controller;

import com.cookquest.auth.entity.CustomUserDetails;
import com.cookquest.profile.dto.*;
import com.cookquest.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return ResponseEntity.ok(profileService.getProfile(userDetails.getId()));
    }

    @PatchMapping("/me/language")
    public ResponseEntity<Void> updateLanguage(
            @Valid @RequestBody UpdateLanguageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        profileService.updateLanguage(userDetails.getId(), request);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/me/mascot")
    public ResponseEntity<Void> updateMascot(
            @Valid @RequestBody UpdateMascotRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        profileService.updateMascot(userDetails.getId(), request);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/me/preferences")
    public ResponseEntity<UserProfileResponse> updatePreferences(
            @Valid @RequestBody UpdatePreferencesRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(profileService.updatePreferences(userDetails.getId(), request));
    }
}