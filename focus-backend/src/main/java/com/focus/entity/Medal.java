package com.focus.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "medals")
public class Medal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "medal_id", nullable = false)
    private String medalId;

    public Medal() {}

    public Medal(User user, String medalId) {
        this.user = user;
        this.medalId = medalId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getMedalId() { return medalId; }
    public void setMedalId(String medalId) { this.medalId = medalId; }
}
