package com.bezkoder.springjwt.groups.expenses.dto;

public class SettlementResponse {
    private Long fromUserId;
    private Long toUserId;

    private String fromUsername;
    private String toUsername;

    private Double amount;

    public SettlementResponse(Long fromUserId, Long toUserId, String fromUsername, String toUsername, Double amount) {
        this.fromUserId = fromUserId;
        this.toUserId = toUserId;
        this.fromUsername = fromUsername;
        this.toUsername = toUsername;
        this.amount = amount;
    }
    public Long getFromUserId() {
        return fromUserId;
    }
    public void setFromUserId(Long fromUserId) {
        this.fromUserId = fromUserId;
    }
    public Long getToUserId() {
        return toUserId;
    }
    public void setToUserId(Long toUserId) {
        this.toUserId = toUserId;
    }
    public String getFromUsername() {
        return fromUsername;
    }
    public void setFromUsername(String fromUsername) {
        this.fromUsername = fromUsername;
    }
    public String getToUsername() {
        return toUsername;
    }
    public void setToUsername(String toUsername) {
        this.toUsername = toUsername;
    }
    public Double getAmount() {
        return amount;
    }
    public void setAmount(Double amount) {
        this.amount = amount;
    }
}


