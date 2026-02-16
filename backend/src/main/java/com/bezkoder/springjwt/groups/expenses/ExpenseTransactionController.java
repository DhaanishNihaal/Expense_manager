package com.bezkoder.springjwt.groups.expenses;

import com.bezkoder.springjwt.groups.expenses.dto.CreateTransactionRequest;
import com.bezkoder.springjwt.groups.expenses.dto.ExpenseTransactionResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses/{expenseId}")
public class ExpenseTransactionController {

    private final ExpenseTransactionService transactionService;

    public ExpenseTransactionController(
            ExpenseTransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // ============================
    // GET all transactions
    // ============================
    @GetMapping("/transactions")
    public List<ExpenseTransactionResponse> getTransactions(
            @PathVariable Long expenseId) {

        return transactionService.getTransactionsByExpense(expenseId);
    }

    // ============================
    // ADD transaction
    // ============================
    @PostMapping("/transactions")
    public void addTransaction(
            @PathVariable Long expenseId,
            @RequestBody CreateTransactionRequest request,Authentication authentication) {
            String username = authentication.getName();
        transactionService.addTransaction(expenseId, username,request);
    }

    // ============================
    // DELETE transaction
    // ============================
    @DeleteMapping("/payments/{paymentGroupId}")
    public void deletePayment(
            @PathVariable Long expenseId,
            @PathVariable String paymentGroupId,
            Authentication authentication) {

        transactionService.deletePayment(expenseId,paymentGroupId,authentication.getName());
    }

}