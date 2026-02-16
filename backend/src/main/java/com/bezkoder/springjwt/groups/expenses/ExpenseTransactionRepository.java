package com.bezkoder.springjwt.groups.expenses;
import com.bezkoder.springjwt.groups.expenses.ExpenseTransaction;
import com.bezkoder.springjwt.groups.expenses.dto.ExpenseTransactionResponse;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExpenseTransactionRepository
        extends JpaRepository<ExpenseTransaction, Long> {
    @Query("""
        SELECT et
        FROM ExpenseTransaction et
        WHERE et.expense.group.id = :groupId
    """)
    List<ExpenseTransaction> findAllByGroupId(@Param("groupId") Long groupId);
    // Get all transactions for a specific expense
    List<ExpenseTransaction> findByExpenseId(Long expenseId);

    // Get all transactions for all expenses in a group
    List<ExpenseTransaction> findByExpenseGroupId(Long groupId);

    List<ExpenseTransaction> findByExpenseIdAndPaymentGroupId(Long expenseId, String paymentGroupId);
}
