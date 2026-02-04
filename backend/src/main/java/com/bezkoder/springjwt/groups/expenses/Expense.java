package com.bezkoder.springjwt.groups.expense;

import com.bezkoder.springjwt.groups.Group;
import com.bezkoder.springjwt.models.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Dinner, Taxi, Hotel, etc.
    @Column(nullable = false)
    private String title;

    // Optional description
    private String description;

    // Total amount of the expense
    @Column(nullable = false)
    private Double totalAmount;

    // Which group this expense belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    // User who created the expense (not necessarily who paid)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    // When the expense was created
    private LocalDateTime createdAt = LocalDateTime.now();

    // All split/payment records for this expense
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseTransaction> transactions;

    /* ========================
       Getters and Setters
       ======================== */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
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

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<ExpenseTransaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<ExpenseTransaction> transactions) {
        this.transactions = transactions;
    }
}