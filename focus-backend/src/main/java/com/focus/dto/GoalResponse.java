package com.focus.dto;

public class GoalResponse {

    private Double dailyGoal;
    private Double weeklyGoal;
    private Double annualGoal;
    private Double dailyKm;
    private Double weeklyKm;
    private Double annualKm;

    public Double getDailyGoal() { return dailyGoal; }
    public void setDailyGoal(Double dailyGoal) { this.dailyGoal = dailyGoal; }

    public Double getWeeklyGoal() { return weeklyGoal; }
    public void setWeeklyGoal(Double weeklyGoal) { this.weeklyGoal = weeklyGoal; }

    public Double getAnnualGoal() { return annualGoal; }
    public void setAnnualGoal(Double annualGoal) { this.annualGoal = annualGoal; }

    public Double getDailyKm() { return dailyKm; }
    public void setDailyKm(Double dailyKm) { this.dailyKm = dailyKm; }

    public Double getWeeklyKm() { return weeklyKm; }
    public void setWeeklyKm(Double weeklyKm) { this.weeklyKm = weeklyKm; }

    public Double getAnnualKm() { return annualKm; }
    public void setAnnualKm(Double annualKm) { this.annualKm = annualKm; }
}
