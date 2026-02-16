package com.bezkoder.springjwt.groups.balances;
import com.bezkoder.springjwt.groups.balances.dto.BalanceResponse;
import com.bezkoder.springjwt.groups.expenses.ExpenseTransaction;
import com.bezkoder.springjwt.groups.expenses.ExpenseTransactionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BalanceService {

    private final ExpenseTransactionRepository transactionRepository;

    public BalanceService(ExpenseTransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    // 🔹 Group-level
    public List<BalanceResponse> getGroupBalances(Long groupId) {

        List<ExpenseTransaction> transactions =
                transactionRepository.findByExpense_GroupId(groupId);

        return SettlementEngine.settle(transactions);
    }

    // 🔹 Expense-level
    public List<BalanceResponse> getExpenseBalances(Long expenseId) {

        List<ExpenseTransaction> transactions =
                transactionRepository.findByExpenseId(expenseId);

        return SettlementEngine.settle(transactions);
    }

    // 🔹 Global (optional)
    public List<BalanceResponse> getGlobalBalances() {

        List<ExpenseTransaction> transactions =
                transactionRepository.findAll();

        return SettlementEngine.settle(transactions);
    }
}