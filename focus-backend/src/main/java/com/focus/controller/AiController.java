package com.focus.controller;

import com.focus.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/tip")
    public ResponseEntity<?> getTip() {
        String tip = aiService.generateTip();
        return ResponseEntity.ok(Map.of("tip", tip != null ? tip : ""));
    }
}
