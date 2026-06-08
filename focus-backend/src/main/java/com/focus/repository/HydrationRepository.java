package com.focus.repository;

import com.focus.entity.Hydration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface HydrationRepository extends JpaRepository<Hydration, Long> {
    Optional<Hydration> findByUserIdAndDateAndUnit(Long userId, LocalDate date, String unit);
}
