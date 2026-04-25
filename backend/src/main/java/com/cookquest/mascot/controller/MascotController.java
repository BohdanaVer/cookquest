package com.cookquest.mascot.controller;

import com.cookquest.mascot.dto.MascotConfig;
import com.cookquest.mascot.dto.MascotResponse;
import com.cookquest.mascot.service.MascotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mascots")
@RequiredArgsConstructor
public class MascotController {

    private final MascotService mascotService;

    @PostMapping("/generate")
    public ResponseEntity<MascotResponse> generateMascot(@RequestBody MascotConfig config) {
        MascotResponse response = mascotService.generateMascot(config);
        if (response.success()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}