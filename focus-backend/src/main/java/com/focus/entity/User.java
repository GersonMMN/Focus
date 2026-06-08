package com.focus.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private Double height;
    private Double weight;

    @Column(name = "total_km", nullable = false)
    private Double totalKm = 0.0;

    @Column(name = "active_days", nullable = false)
    private Integer activeDays = 0;

    @Column(name = "streak", nullable = false)
    private Integer streak = 0;

    @Column(name = "streak_best", nullable = false)
    private Integer streakBest = 0;

    @Column(name = "last_run_date")
    private LocalDate lastRunDate;

    @Column(name = "streak_last_date")
    private LocalDate streakLastDate;

    @Column(name = "daily_goal")
    private Double dailyGoal;

    @Column(name = "weekly_goal")
    private Double weeklyGoal;

    @Column(name = "annual_goal")
    private Double annualGoal;

    @Column(name = "water_unit")
    private String waterUnit = "copos";

    @Column(name = "water_goal")
    private Double waterGoal = 8.0;

    @Column(name = "last_imc")
    private String lastImc;

    @Column(name = "last_imc_label")
    private String lastImcLabel;

    public User() {}

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

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

    public LocalDate getLastRunDate() { return lastRunDate; }
    public void setLastRunDate(LocalDate lastRunDate) { this.lastRunDate = lastRunDate; }

    public LocalDate getStreakLastDate() { return streakLastDate; }
    public void setStreakLastDate(LocalDate streakLastDate) { this.streakLastDate = streakLastDate; }

    public Double getDailyGoal() { return dailyGoal; }
    public void setDailyGoal(Double dailyGoal) { this.dailyGoal = dailyGoal; }

    public Double getWeeklyGoal() { return weeklyGoal; }
    public void setWeeklyGoal(Double weeklyGoal) { this.weeklyGoal = weeklyGoal; }

    public Double getAnnualGoal() { return annualGoal; }
    public void setAnnualGoal(Double annualGoal) { this.annualGoal = annualGoal; }

    public String getWaterUnit() { return waterUnit; }
    public void setWaterUnit(String waterUnit) { this.waterUnit = waterUnit; }

    public Double getWaterGoal() { return waterGoal; }
    public void setWaterGoal(Double waterGoal) { this.waterGoal = waterGoal; }

    public String getLastImc() { return lastImc; }
    public void setLastImc(String lastImc) { this.lastImc = lastImc; }

    public String getLastImcLabel() { return lastImcLabel; }
    public void setLastImcLabel(String lastImcLabel) { this.lastImcLabel = lastImcLabel; }
}
