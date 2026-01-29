package com.bezkoder.springjwt.groups.expense.balance;

import com.bezkoder.springjwt.groups.expense.balance.dto.ExpenseBalanceResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/expenses/{expenseId}/balances")
public class ExpenseBalanceController {

    private final ExpenseBalanceService expenseBalanceService;

    public ExpenseBalanceController(ExpenseBalanceService expenseBalanceService) {
        this.expenseBalanceService = expenseBalanceService;
    }

    @GetMapping
    public List<ExpenseBalanceResponse> getExpenseBalances(
            @PathVariable Long groupId,
            @PathVariable Long expenseId) {

        // groupId kept for correctness & future validation
        return expenseBalanceService.getExpenseBalances(expenseId);
    }
}
