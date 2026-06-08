package com.focus.dto;

import jakarta.validation.constraints.NotNull;

public class HydrationRequest {

    @NotNull
    private Double count;

    private String unit;

    public Double getCount() { return count; }
    public void setCount(Double count) { this.count = count; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
}
