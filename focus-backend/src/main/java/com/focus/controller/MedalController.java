package com.focus.controller;

import com.focus.service.MedalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medals")
public class MedalController {

    private final MedalService medalService;

    public MedalController(MedalService medalService) {
        this.medalService = medalService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMedals(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(medalService.getMedals(userId));
    }
}
