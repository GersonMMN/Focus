package com.focus.repository;

import com.focus.entity.Medal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedalRepository extends JpaRepository<Medal, Long> {
    List<Medal> findByUserId(Long userId);
    Optional<Medal> findByUserIdAndMedalId(Long userId, String medalId);
}
