package com.bezkoder.springjwt.groups.expenses;
import com.bezkoder.springjwt.groups.balances.SettlementEngine;
import com.bezkoder.springjwt.groups.expenses.dto.SettlementResponse;
import com.bezkoder.springjwt.groups.balances.dto.BalanceResponse;
import com.bezkoder.springjwt.models.User;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ExpenseSettlementService {

    private final ExpenseTransactionRepository transactionRepository;

    public ExpenseSettlementService(ExpenseTransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<BalanceResponse> getExpenseSettlements(Long expenseId) {
        List<ExpenseTransaction> transactions = transactionRepository.findByExpenseId(expenseId);

        return SettlementEngine.settle(transactions);

    }
}