package com.focus.controller;

import com.focus.dto.GoalRequest;
import com.focus.dto.GoalResponse;
import com.focus.service.GoalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public ResponseEntity<GoalResponse> getGoals(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(goalService.getGoals(userId));
    }

    @PutMapping
    public ResponseEntity<GoalResponse> updateGoals(Authentication auth,
                                                     @RequestBody GoalRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(goalService.updateGoals(userId, request));
    }
}
