package com.focus.controller;

import com.focus.dto.HydrationRequest;
import com.focus.service.HydrationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hydration")
public class HydrationController {

    private final HydrationService hydrationService;

    public HydrationController(HydrationService hydrationService) {
        this.hydrationService = hydrationService;
    }

    @GetMapping
    public ResponseEntity<?> getHydration(Authentication auth,
                                           @RequestParam(defaultValue = "copos") String unit) {
        Long userId = (Long) auth.getPrincipal();
        double count = hydrationService.getHydration(userId, unit);
        return ResponseEntity.ok(Map.of("count", count, "unit", unit));
    }

    @PostMapping
    public ResponseEntity<?> setHydration(Authentication auth,
                                           @Valid @RequestBody HydrationRequest request) {
        Long userId = (Long) auth.getPrincipal();
        double count = hydrationService.setHydration(userId, request);
        String unit = request.getUnit() != null ? request.getUnit() : "copos";
        return ResponseEntity.ok(Map.of("count", count, "unit", unit));
    }
}
