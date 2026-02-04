package com.bezkoder.springjwt.groups.expenses.dto;

import java.util.List;

public class CreateExpenseRequest {

    private String description;
    private List<ExpenseTransactionResponse> transactions;

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<ExpenseTransactionResponse> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<ExpenseTransactionResponse> transactions) {
        this.transactions = transactions;
    }
}
