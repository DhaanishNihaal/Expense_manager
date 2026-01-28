package com.bezkoder.springjwt.groups.expense.dto;

import java.util.List;

public class CreateExpenseRequest {

    private String description;
    private List<ExpenseTransactionRequest> transactions;

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<ExpenseTransactionRequest> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<ExpenseTransactionRequest> transactions) {
        this.transactions = transactions;
    }
}
