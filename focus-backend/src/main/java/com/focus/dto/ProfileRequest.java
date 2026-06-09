package com.focus.dto;

public class ProfileRequest {

    private String name;
    private String email;
    private Double height;
    private Double weight;
    private String waterUnit;
    private Double waterGoal;
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

    public String getWaterUnit() { return waterUnit; }
    public void setWaterUnit(String waterUnit) { this.waterUnit = waterUnit; }

    public Double getWaterGoal() { return waterGoal; }
    public void setWaterGoal(Double waterGoal) { this.waterGoal = waterGoal; }

    public String getLastImc() { return lastImc; }
    public void setLastImc(String lastImc) { this.lastImc = lastImc; }

    public String getLastImcLabel() { return lastImcLabel; }
    public void setLastImcLabel(String lastImcLabel) { this.lastImcLabel = lastImcLabel; }
}
