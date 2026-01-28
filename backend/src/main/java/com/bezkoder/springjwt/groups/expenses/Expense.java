package com.bezkoder.springjwt.groups.expense;

import com.bezkoder.springjwt.groups.Group;
import com.bezkoder.springjwt.models.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which group this expense belongs to
    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    // Example: Dinner, Taxi, Hotel
    @Column(nullable = false)
    private String description;

    // Who created/logged this expense
    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    private LocalDateTime createdAt = LocalDateTime.now();

    // -------- Getters & Setters --------

    public Long getId() {
        return id;
    }

    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
