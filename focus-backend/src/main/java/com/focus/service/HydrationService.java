package com.focus.service;

import com.focus.dto.HydrationRequest;
import com.focus.entity.Hydration;
import com.focus.entity.User;
import com.focus.repository.HydrationRepository;
import com.focus.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class HydrationService {

    private final HydrationRepository hydrationRepository;
    private final UserRepository userRepository;

    public HydrationService(HydrationRepository hydrationRepository, UserRepository userRepository) {
        this.hydrationRepository = hydrationRepository;
        this.userRepository = userRepository;
    }

    public Double getHydration(Long userId, String unit) {
        String u = (unit != null) ? unit : "copos";
        return hydrationRepository
                .findByUserIdAndDateAndUnit(userId, LocalDate.now(), u)
                .map(Hydration::getCount)
                .orElse(0.0);
    }

    @Transactional
    public Double setHydration(Long userId, HydrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String unit = request.getUnit() != null ? request.getUnit() : "copos";
        LocalDate today = LocalDate.now();

        Hydration hydration = hydrationRepository
                .findByUserIdAndDateAndUnit(userId, today, unit)
                .orElse(new Hydration(user, today, 0.0, unit));

        hydration.setCount(Math.max(0, request.getCount()));
        hydrationRepository.save(hydration);

        return hydration.getCount();
    }
}
