package com.bezkoder.springjwt.groups.expenses;

import com.bezkoder.springjwt.groups.expenses.dto.CreateTransactionRequest;
import com.bezkoder.springjwt.groups.expenses.dto.ExpenseTransactionResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses/{expenseId}/transactions")
public class ExpenseTransactionController {

    private final ExpenseTransactionService transactionService;

    public ExpenseTransactionController(
            ExpenseTransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // ============================
    // GET all transactions
    // ============================
    @GetMapping
    public List<ExpenseTransactionResponse> getTransactions(
            @PathVariable Long expenseId) {

        return transactionService.getTransactionsByExpense(expenseId);
    }

    // ============================
    // ADD transaction
    // ============================
    @PostMapping
    public void addTransaction(
            @PathVariable Long expenseId,
            @RequestBody CreateTransactionRequest request) {

        transactionService.addTransaction(expenseId, request);
    }

    // ============================
    // DELETE transaction
    // ============================
    @DeleteMapping("/{transactionId}")
    public void deleteTransaction(
            @PathVariable Long expenseId,
            @PathVariable Long transactionId) {

        transactionService.deleteTransaction(expenseId, transactionId);
    }
}