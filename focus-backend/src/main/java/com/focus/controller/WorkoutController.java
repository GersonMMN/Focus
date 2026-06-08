package com.focus.controller;

import com.focus.dto.WorkoutRequest;
import com.focus.dto.WorkoutResponse;
import com.focus.service.MedalService;
import com.focus.service.WorkoutService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workouts")
public class WorkoutController {

    private final WorkoutService workoutService;
    private final MedalService medalService;

    public WorkoutController(WorkoutService workoutService, MedalService medalService) {
        this.workoutService = workoutService;
        this.medalService = medalService;
    }

    @GetMapping
    public ResponseEntity<List<WorkoutResponse>> getWorkouts(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(workoutService.getWorkouts(userId));
    }

    @PostMapping
    public ResponseEntity<?> addWorkout(Authentication auth,
                                         @Valid @RequestBody WorkoutRequest request) {
        Long userId = (Long) auth.getPrincipal();
        WorkoutResponse workout = workoutService.addWorkout(userId, request);
        List<String> newMedals = medalService.checkNewMedals(userId);
        return ResponseEntity.ok(Map.of("workout", workout, "newMedals", newMedals));
    }
}
