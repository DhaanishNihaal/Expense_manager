package com.bezkoder.springjwt.groups.expense.balance.dto;

public class ExpenseBalanceResponse {

    private Long fromUserId;
    private Long toUserId;
    private Double amount;

    public ExpenseBalanceResponse(Long fromUserId, Long toUserId, Double amount) {
        this.fromUserId = fromUserId;
        this.toUserId = toUserId;
        this.amount = amount;
    }

    public Long getFromUserId() {
        return fromUserId;
    }

    public Long getToUserId() {
        return toUserId;
    }

    public Double getAmount() {
        return amount;
    }
}
