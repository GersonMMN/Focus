package com.focus.service;

import com.focus.dto.ProfileRequest;
import com.focus.dto.ProfileResponse;
import com.focus.entity.User;
import com.focus.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {

    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        ProfileResponse response = new ProfileResponse();
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setHeight(user.getHeight());
        response.setWeight(user.getWeight());
        response.setTotalKm(user.getTotalKm());
        response.setActiveDays(user.getActiveDays());
        response.setStreak(user.getStreak());
        response.setStreakBest(user.getStreakBest());
        response.setLastImc(user.getLastImc());
        response.setLastImcLabel(user.getLastImcLabel());
        response.setWaterUnit(user.getWaterUnit());
        response.setWaterGoal(user.getWaterGoal());
        return response;
    }

    public ProfileResponse updateProfile(Long userId, ProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (request.getName() != null)         user.setName(request.getName());
        if (request.getEmail() != null)         user.setEmail(request.getEmail());
        if (request.getHeight() != null)        user.setHeight(request.getHeight());
        if (request.getWeight() != null)        user.setWeight(request.getWeight());
        if (request.getWaterUnit() != null)     user.setWaterUnit(request.getWaterUnit());
        if (request.getWaterGoal() != null)     user.setWaterGoal(request.getWaterGoal());
        if (request.getLastImc() != null)       user.setLastImc(request.getLastImc());
        if (request.getLastImcLabel() != null)  user.setLastImcLabel(request.getLastImcLabel());

        user = userRepository.save(user);

        ProfileResponse response = new ProfileResponse();
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setHeight(user.getHeight());
        response.setWeight(user.getWeight());
        response.setTotalKm(user.getTotalKm());
        response.setActiveDays(user.getActiveDays());
        response.setStreak(user.getStreak());
        response.setStreakBest(user.getStreakBest());
        response.setLastImc(user.getLastImc());
        response.setLastImcLabel(user.getLastImcLabel());
        response.setWaterUnit(user.getWaterUnit());
        response.setWaterGoal(user.getWaterGoal());
        return response;
    }
}
