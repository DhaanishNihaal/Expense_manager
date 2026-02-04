package com.bezkoder.springjwt.groups.expenses.dto;

public class ExpenseTransactionResponse {

    private Long transactionId;

    private Long payerId;
    private String payerName;

    private Long receiverId;
    private String receiverName;

    private Double amount;

    public ExpenseTransactionResponse(
            Long transactionId,
            Long payerId,
            String payerName,
            Long receiverId,
            String receiverName,
            Double amount
    ) {
        this.transactionId = transactionId;
        this.payerId = payerId;
        this.payerName = payerName;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.amount = amount;
    }

    public Long getTransactionId() {
        return transactionId;
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
