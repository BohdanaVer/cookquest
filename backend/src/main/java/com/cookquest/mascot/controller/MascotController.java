package com.cookquest.mascot.controller;

import com.cookquest.mascot.dto.MascotCatalogDto;
import com.cookquest.mascot.dto.MascotConfig;
import com.cookquest.mascot.service.MascotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mascots")
@RequiredArgsConstructor
public class MascotController {

    private final MascotService mascotService;

    @GetMapping
    public ResponseEntity<List<MascotCatalogDto>> getCatalog() {
        return ResponseEntity.ok(mascotService.getCatalog());
    }

    @PostMapping("/{mascotId}/buy")
    public ResponseEntity<MascotCatalogDto> buyMascot(@PathVariable Long mascotId) {
        return ResponseEntity.ok(mascotService.buyMascot(mascotId));
    }

    @PostMapping("/{mascotId}/equip")
    public ResponseEntity<Void> equipMascot(@PathVariable Long mascotId) {
        mascotService.setActiveMascot(mascotId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/generate")
    public ResponseEntity<MascotCatalogDto> generateCustomMascot(@RequestBody MascotConfig config) {
        return ResponseEntity.ok(mascotService.generateCustomMascot(config));
    }

    @GetMapping("/settings")
    public ResponseEntity<java.util.Map<String, Integer>> getMascotSettings() {
        return ResponseEntity.ok(java.util.Map.of("generationPrice", mascotService.getGenerationPrice()));
    }
}