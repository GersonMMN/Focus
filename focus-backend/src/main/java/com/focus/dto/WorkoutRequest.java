package com.focus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class WorkoutRequest {

    @NotBlank
    private String type;

    private Double km;

    @NotNull
    private Integer duration;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Double getKm() { return km; }
    public void setKm(Double km) { this.km = km; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
}
