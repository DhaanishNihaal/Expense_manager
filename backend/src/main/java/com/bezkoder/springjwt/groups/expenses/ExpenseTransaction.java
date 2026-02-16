package com.bezkoder.springjwt.groups.expenses;

import com.bezkoder.springjwt.models.User;
import jakarta.persistence.*;

@Entity
@Table(name = "expense_transactions")
public class ExpenseTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String paymentGroupId;

    // Which expense this transaction belongs to (Dinner, Taxi, etc.)
    @ManyToOne
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    // Who paid the money
    @ManyToOne
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    // For whom the money was paid
    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(nullable = false)
    private Double amount;

    // -------- Getters & Setters --------

    public Long getId() {
        return id;
    }

    public Expense getExpense() {
        return expense;
    }

    public void setExpense(Expense expense) {
        this.expense = expense;
    }

    public User getPayer() {
        return payer;
    }

    public void setPayer(User payer) {
        this.payer = payer;
    }

    public User getReceiver() {
        return receiver;
    }

    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
    public String getPaymentGroupId() {
        return paymentGroupId;
    }
    public void setPaymentGroupId(String paymentGroupId) {
        this.paymentGroupId = paymentGroupId;
    }
}
