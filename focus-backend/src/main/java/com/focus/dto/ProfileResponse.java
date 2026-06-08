package com.focus.dto;

public class ProfileResponse {

    private String name;
    private String email;
    private Double height;
    private Double weight;
    private Double totalKm;
    private Integer activeDays;
    private Integer streak;
    private Integer streakBest;
    private String lastImc;
    private String lastImcLabel;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Double getTotalKm() { return totalKm; }
    public void setTotalKm(Double totalKm) { this.totalKm = totalKm; }

    public Integer getActiveDays() { return activeDays; }
    public void setActiveDays(Integer activeDays) { this.activeDays = activeDays; }

    public Integer getStreak() { return streak; }
    public void setStreak(Integer streak) { this.streak = streak; }

    public Integer getStreakBest() { return streakBest; }
    public void setStreakBest(Integer streakBest) { this.streakBest = streakBest; }

    public String getLastImc() { return lastImc; }
    public void setLastImc(String lastImc) { this.lastImc = lastImc; }

    public String getLastImcLabel() { return lastImcLabel; }
    public void setLastImcLabel(String lastImcLabel) { this.lastImcLabel = lastImcLabel; }
}
