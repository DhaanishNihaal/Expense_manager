package com.bezkoder.springjwt.groups.expense;

import com.bezkoder.springjwt.groups.expense.dto.CreateExpenseRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
}
