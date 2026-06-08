package com.focus.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "hydration")
public class Hydration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Double count;

    @Column(nullable = false)
    private String unit;

    public Hydration() {}

    public Hydration(User user, LocalDate date, Double count, String unit) {
        this.user = user;
        this.date = date;
        this.count = count;
        this.unit = unit;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Double getCount() { return count; }
    public void setCount(Double count) { this.count = count; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
}
