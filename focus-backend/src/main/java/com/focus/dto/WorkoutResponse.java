package com.focus.dto;

public class WorkoutResponse {

    private Long id;
    private String type;
    private Double km;
    private Integer duration;
    private String date;

    public WorkoutResponse(Long id, String type, Double km, Integer duration, String date) {
        this.id = id;
        this.type = type;
        this.km = km;
        this.duration = duration;
        this.date = date;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Double getKm() { return km; }
    public void setKm(Double km) { this.km = km; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
}
