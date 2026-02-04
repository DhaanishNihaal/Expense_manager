package com.bezkoder.springjwt.groups.expense;

import com.bezkoder.springjwt.groups.expense.dto.ExpenseTransactionResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses/{expenseId}/transactions")
public class ExpenseTransactionController {

    private final ExpenseTransactionService transactionService;

    public ExpenseTransactionController(ExpenseTransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<ExpenseTransactionResponse> getTransactions(
            @PathVariable Long expenseId) {
        return transactionService.getTransactionsByExpense(expenseId);
    }
}