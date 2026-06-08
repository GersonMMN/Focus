package com.focus.service;

import com.focus.entity.Medal;
import com.focus.entity.User;
import com.focus.repository.MedalRepository;
import com.focus.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MedalService {

    private final MedalRepository medalRepository;
    private final UserRepository userRepository;

    public MedalService(MedalRepository medalRepository, UserRepository userRepository) {
        this.medalRepository = medalRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getMedals(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Set<String> earned = medalRepository.findByUserId(userId).stream()
                .map(Medal::getMedalId)
                .collect(Collectors.toSet());

        return MEDAL_DEFS.stream().map(m -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", m.id);
            map.put("icon", m.icon);
            map.put("title", m.title);
            map.put("desc", m.desc);
            map.put("earned", earned.contains(m.id));
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public List<String> checkNewMedals(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Set<String> earned = medalRepository.findByUserId(userId).stream()
                .map(Medal::getMedalId)
                .collect(Collectors.toSet());

        List<String> newMedals = new ArrayList<>();

        for (MedalDef m : MEDAL_DEFS) {
            if (!earned.contains(m.id) && m.check.test(user)) {
                medalRepository.save(new Medal(user, m.id));
                newMedals.add(m.title);
            }
        }

        return newMedals;
    }

    private static class MedalDef {
        final String id, icon, title, desc;
        final java.util.function.Predicate<User> check;

        MedalDef(String id, String icon, String title, String desc, java.util.function.Predicate<User> check) {
            this.id = id; this.icon = icon; this.title = title;
            this.desc = desc; this.check = check;
        }
    }

    private static final List<MedalDef> MEDAL_DEFS = List.of(
        new MedalDef("first", "🥇", "Primeira Corrida", "Registrou o primeiro treino", u -> u.getActiveDays() >= 1),
        new MedalDef("km10", "🏅", "10 km", "Acumulou 10 km", u -> u.getTotalKm() >= 10),
        new MedalDef("km50", "🥈", "50 km", "Acumulou 50 km", u -> u.getTotalKm() >= 50),
        new MedalDef("km100", "🏆", "100 km", "Acumulou 100 km — Centurião!", u -> u.getTotalKm() >= 100),
        new MedalDef("km500", "💎", "500 km", "Acumulou 500 km — Lendário!", u -> u.getTotalKm() >= 500),
        new MedalDef("streak7", "🔥", "7 Dias Seguidos", "Manteve sequência de 7 dias", u -> u.getStreakBest() >= 7),
        new MedalDef("streak30", "⚡", "Mês Perfeito", "Manteve sequência de 30 dias", u -> u.getStreakBest() >= 30),
        new MedalDef("days20", "📅", "20 Dias Ativos", "Treinou em 20 dias diferentes", u -> u.getActiveDays() >= 20)
    );
}
