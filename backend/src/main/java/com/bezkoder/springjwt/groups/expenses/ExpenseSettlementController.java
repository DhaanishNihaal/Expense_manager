package com.bezkoder.springjwt.groups.expenses;

import com.bezkoder.springjwt.groups.expenses.dto.SettlementResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses/{expenseId}/settlements")
public class ExpenseSettlementController{

    private final ExpenseSettlementService settlementService;

    public ExpenseSettlementController(ExpenseSettlementService settlementService) {
        this.settlementService = settlementService;
    }

    @GetMapping
    public List<SettlementResponse> getExpenseSettlements(
            @PathVariable Long expenseId) {

        return settlementService.getExpenseSettlements(expenseId);
    }
}