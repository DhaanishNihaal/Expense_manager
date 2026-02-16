package com.bezkoder.springjwt.groups.expenses;

import com.bezkoder.springjwt.groups.expenses.dto.CreateExpenseRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.bezkoder.springjwt.groups.expenses.dto.ExpenseResponse;
import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public void createExpense(@PathVariable Long groupId,
                              @RequestBody CreateExpenseRequest request,
                              Authentication authentication) {

        String username = authentication.getName();
        expenseService.createExpense(groupId, request, username);
    }
    @GetMapping
    public List<ExpenseResponse> getExpenses(
        @PathVariable Long groupId,
        Authentication authentication) {
        String username = authentication.getName();
        return expenseService.getExpensesByGroup(groupId, username);
    }
    @DeleteMapping("/{expenseId}")
    public void deleteExpense(@PathVariable Long groupId,
                              @PathVariable Long expenseId,
                              Authentication authentication) {

        String username = authentication.getName();
        expenseService.deleteExpense(groupId, expenseId, username);
    }
}
