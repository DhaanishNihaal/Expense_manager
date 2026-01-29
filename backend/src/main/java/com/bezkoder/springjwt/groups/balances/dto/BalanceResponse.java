package com.bezkoder.springjwt.groups.balance.dto;

public class BalanceResponse {

    private Long fromUserId;
    private Long toUserId;
    private Double amount;

    public BalanceResponse(Long fromUserId, Long toUserId, Double amount) {
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
