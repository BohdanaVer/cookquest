package com.cookquest.cooking.controller;

import com.cookquest.cooking.dto.CookingSessionDto;
import com.cookquest.cooking.dto.StartCookingRequest;
import com.cookquest.cooking.dto.StepVerificationResponse;
import com.cookquest.cooking.service.CookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/v1/cooking")
@RequiredArgsConstructor
public class CookingController {

    private final CookingService cookingService;

    @PostMapping("/start")
    public ResponseEntity<CookingSessionDto> startCooking(@RequestBody StartCookingRequest request) {
        return ResponseEntity.ok(cookingService.startCooking(request));
    }

    @GetMapping("/active")
    public ResponseEntity<List<CookingSessionDto>> getActiveSessions() {
        return ResponseEntity.ok(cookingService.getActiveSessions());
    }

    @PostMapping("/{sessionId}/cancel")
    public ResponseEntity<Void> cancelCooking(@PathVariable Long sessionId) {
        cookingService.cancelCooking(sessionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/{sessionId}/verify-step", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StepVerificationResponse> verifyStep(
            @PathVariable Long sessionId,
            @RequestParam("stepNumber") int stepNumber,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "language", required = false) String requestLanguage) {

        return ResponseEntity.ok(cookingService.verifyStep(sessionId, file, stepNumber, requestLanguage));
    }
}