package com.focus.dto;

public class GoalRequest {

    private Double dailyGoal;
    private Double weeklyGoal;
    private Double annualGoal;

    public Double getDailyGoal() { return dailyGoal; }
    public void setDailyGoal(Double dailyGoal) { this.dailyGoal = dailyGoal; }

    public Double getWeeklyGoal() { return weeklyGoal; }
    public void setWeeklyGoal(Double weeklyGoal) { this.weeklyGoal = weeklyGoal; }

    public Double getAnnualGoal() { return annualGoal; }
    public void setAnnualGoal(Double annualGoal) { this.annualGoal = annualGoal; }
}
