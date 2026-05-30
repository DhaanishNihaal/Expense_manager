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
        LEFT JOIN et.expense e
        LEFT JOIN e.group eg
        WHERE eg.id = :groupId OR et.group.id = :groupId
    """)
    List<ExpenseTransaction> findAllByGroupId(@Param("groupId") Long groupId);
    // Get all transactions for a specific expense
    List<ExpenseTransaction> findByExpenseId(Long expenseId);

    // Get all transactions for all expenses in a group
    @Query("SELECT et FROM ExpenseTransaction et LEFT JOIN et.expense e LEFT JOIN e.group eg WHERE eg.id = :groupId OR et.group.id = :groupId")
    List<ExpenseTransaction> findByExpenseGroupId(@Param("groupId") Long groupId);

    List<ExpenseTransaction> findByExpenseIdAndPaymentGroupId(Long expenseId, String paymentGroupId);

    @Query("SELECT et FROM ExpenseTransaction et LEFT JOIN et.expense e LEFT JOIN e.group eg WHERE eg.id = :groupId OR et.group.id = :groupId")
    List<ExpenseTransaction> findByExpense_GroupId(@Param("groupId") Long groupId);

    List<ExpenseTransaction> findAll();

    List<ExpenseTransaction> findByPayerUsernameOrReceiverUsername(String payerUsername, String receiverUsername);

    @Query("SELECT COALESCE(SUM(et.amount), 0) FROM ExpenseTransaction et JOIN et.expense e WHERE e.group.id = :groupId")
    Double sumAmountByGroupId(@Param("groupId") Long groupId);
}
