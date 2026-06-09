package com.focus.service;

import com.focus.dto.GoalRequest;
import com.focus.dto.GoalResponse;
import com.focus.entity.User;
import com.focus.entity.Workout;
import com.focus.repository.UserRepository;
import com.focus.repository.WorkoutRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class GoalService {

    private static final List<String> DISTANCE_TYPES = List.of("corrida", "ciclismo", "natação", "caminhada");

    private final UserRepository userRepository;
    private final WorkoutRepository workoutRepository;

    public GoalService(UserRepository userRepository, WorkoutRepository workoutRepository) {
        this.userRepository = userRepository;
        this.workoutRepository = workoutRepository;
    }

    public GoalResponse getGoals(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        GoalResponse response = new GoalResponse();
        response.setDailyGoal(user.getDailyGoal());
        response.setWeeklyGoal(user.getWeeklyGoal());
        response.setAnnualGoal(user.getAnnualGoal());
        response.setDailyKm(getKmForPeriod(userId, "daily"));
        response.setWeeklyKm(getKmForPeriod(userId, "weekly"));
        response.setAnnualKm(getKmForPeriod(userId, "annual"));
        return response;
    }

    public GoalResponse updateGoals(Long userId, GoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (request.getDailyGoal() != null) user.setDailyGoal(request.getDailyGoal());
        if (request.getWeeklyGoal() != null) user.setWeeklyGoal(request.getWeeklyGoal());
        if (request.getAnnualGoal() != null) user.setAnnualGoal(request.getAnnualGoal());

        userRepository.save(user);

        GoalResponse response = new GoalResponse();
        response.setDailyGoal(user.getDailyGoal());
        response.setWeeklyGoal(user.getWeeklyGoal());
        response.setAnnualGoal(user.getAnnualGoal());
        response.setDailyKm(getKmForPeriod(userId, "daily"));
        response.setWeeklyKm(getKmForPeriod(userId, "weekly"));
        response.setAnnualKm(getKmForPeriod(userId, "annual"));
        return response;
    }

    private double getKmForPeriod(Long userId, String period) {
        List<Workout> workouts = workoutRepository.findByUserIdOrderByDateDesc(userId);
        LocalDate now = LocalDate.now();

        return workouts.stream()
                .filter(w -> DISTANCE_TYPES.contains(w.getType()))
                .filter(w -> {
                    if ("daily".equals(period)) {
                        return w.getDate().equals(now);
                    } else if ("weekly".equals(period)) {
                        LocalDate startOfWeek = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
                        return !w.getDate().isBefore(startOfWeek);
                    } else if ("annual".equals(period)) {
                        return w.getDate().getYear() == now.getYear();
                    }
                    return false;
                })
                .mapToDouble(w -> w.getKm() != null ? w.getKm() : 0.0)
                .sum();
    }
}
