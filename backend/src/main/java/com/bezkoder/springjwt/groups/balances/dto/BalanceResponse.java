package com.bezkoder.springjwt.groups.balances.dto;

public class BalanceResponse {

    private Long fromUserId;
    private Long toUserId;

    private String fromname;
    private String toname;
    private Double amount;

    public BalanceResponse(Long fromUserId, Long toUserId, String fromname, String toname, Double amount) {
        this.fromUserId = fromUserId;
        this.toUserId = toUserId;
        this.fromname = fromname;
        this.toname = toname;
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
    public String getFromname() {
        return fromname;
    }
    public void setFromname(String fromname) {
        this.fromname = fromname;
    }
    public String getToname() {
        return toname;
    }
    public void setToname(String toname) {
        this.toname = toname;
    }
}
