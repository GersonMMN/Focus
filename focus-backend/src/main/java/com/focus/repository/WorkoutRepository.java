package com.focus.repository;

import com.focus.entity.Workout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface WorkoutRepository extends JpaRepository<Workout, Long> {
    List<Workout> findByUserIdOrderByDateDescIdDesc(Long userId);
    List<Workout> findByUserIdAndDate(Long userId, LocalDate date);
    List<Workout> findByUserIdAndDateBetweenOrderByDate(Long userId, LocalDate start, LocalDate end);
}
