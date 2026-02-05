package com.bezkoder.springjwt.groups.expenses.dto;

import java.util.List;

public class CreateTransactionRequest {

    private List<Long> receiverIds;
    private Double totalAmount;

    public List<Long> getReceiverIds() {
        return receiverIds;
    }

    public void setReceiverIds(List<Long> receiverIds) {
        this.receiverIds = receiverIds;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }
}