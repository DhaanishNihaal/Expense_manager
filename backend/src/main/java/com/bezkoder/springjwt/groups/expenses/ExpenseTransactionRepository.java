package com.bezkoder.springjwt.groups.expense;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseTransactionRepository
        extends JpaRepository<ExpenseTransaction, Long> {

    // Get all transactions for a specific expense
    List<ExpenseTransaction> findByExpenseId(Long expenseId);

    // Get all transactions for all expenses in a group
    List<ExpenseTransaction> findByExpense_GroupId(Long groupId);
}
