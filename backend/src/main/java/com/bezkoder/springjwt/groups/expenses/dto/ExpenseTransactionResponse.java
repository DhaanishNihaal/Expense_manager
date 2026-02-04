package com.bezkoder.springjwt.groups.expense.dto;

public class ExpenseTransactionResponse {

    private Long payerId;
    private String payerName;

    private Long receiverId;
    private String receiverName;

    private Double amount;

    public ExpenseTransactionResponse(
            Long payerId,
            String payerName,
            Long receiverId,
            String receiverName,
            Double amount
    ) {
        this.payerId = payerId;
        this.payerName = payerName;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.amount = amount;
    }

    public Long getPayerId() {
        return payerId;
    }

    public String getPayerName() {
        return payerName;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public Double getAmount() {
        return amount;
    }
}