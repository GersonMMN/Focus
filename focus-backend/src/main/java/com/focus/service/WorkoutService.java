package com.focus.service;

import com.focus.dto.WorkoutRequest;
import com.focus.dto.WorkoutResponse;
import com.focus.entity.User;
import com.focus.entity.Workout;
import com.focus.repository.UserRepository;
import com.focus.repository.WorkoutRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkoutService {

    private static final List<String> DISTANCE_TYPES = List.of("corrida", "ciclismo", "natação", "caminhada");

    private final WorkoutRepository workoutRepository;
    private final UserRepository userRepository;

    public WorkoutService(WorkoutRepository workoutRepository, UserRepository userRepository) {
        this.workoutRepository = workoutRepository;
        this.userRepository = userRepository;
    }

    public List<WorkoutResponse> getWorkouts(Long userId) {
        return workoutRepository.findByUserIdOrderByDateDesc(userId).stream()
                .map(w -> new WorkoutResponse(w.getId(), w.getType(), w.getKm(),
                        w.getDuration(), w.getDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))))
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkoutResponse addWorkout(Long userId, WorkoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        LocalDate today = LocalDate.now();
        boolean isDistance = DISTANCE_TYPES.contains(request.getType());

        if (isDistance && request.getKm() != null) {
            user.setTotalKm(Math.round((user.getTotalKm() + request.getKm()) * 100.0) / 100.0);
        }

        if (user.getLastRunDate() == null || !user.getLastRunDate().equals(today)) {
            user.setActiveDays(user.getActiveDays() + 1);
            user.setLastRunDate(today);
            updateStreak(user, today);
        }

        Workout workout = new Workout(user, request.getType(),
                isDistance ? request.getKm() : 0,
                isDistance ? 0 : request.getDuration(),
                today);
        workout = workoutRepository.save(workout);
        userRepository.save(user);

        return new WorkoutResponse(workout.getId(), workout.getType(), workout.getKm(),
                workout.getDuration(), workout.getDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
    }

    private void updateStreak(User user, LocalDate today) {
        if (user.getStreakLastDate() == null) {
            user.setStreak(1);
        } else {
            long diff = today.toEpochDay() - user.getStreakLastDate().toEpochDay();
            if (diff == 1) {
                user.setStreak(user.getStreak() + 1);
            } else if (diff > 1) {
                user.setStreak(1);
            }
        }

        if (user.getStreak() > user.getStreakBest()) {
            user.setStreakBest(user.getStreak());
        }

        user.setStreakLastDate(today);
    }
}
