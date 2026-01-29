package com.bezkoder.springjwt.groups.expense.balance;

import com.bezkoder.springjwt.groups.expense.ExpenseTransaction;
import com.bezkoder.springjwt.groups.expense.ExpenseTransactionRepository;
import com.bezkoder.springjwt.groups.expense.balance.dto.ExpenseBalanceResponse;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ExpenseBalanceService {

    private final ExpenseTransactionRepository transactionRepository;

    public ExpenseBalanceService(ExpenseTransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<ExpenseBalanceResponse> getExpenseBalances(Long expenseId) {

        List<ExpenseTransaction> transactions =
                transactionRepository.findByExpenseId(expenseId);

        Map<String, Double> balanceMap = new HashMap<>();

        for (ExpenseTransaction tx : transactions) {

            Long fromId = tx.getReceiver().getId();
            Long toId   = tx.getPayer().getId();

            if (fromId.equals(toId)) continue;

            String key = fromId + "_" + toId;

            balanceMap.put(
                key,
                balanceMap.getOrDefault(key, 0.0) + tx.getAmount()
            );
        }

        List<ExpenseBalanceResponse> result = new ArrayList<>();

        for (Map.Entry<String, Double> entry : balanceMap.entrySet()) {
            String[] parts = entry.getKey().split("_");

            result.add(
                new ExpenseBalanceResponse(
                    Long.parseLong(parts[0]),
                    Long.parseLong(parts[1]),
                    entry.getValue()
                )
            );
        }

        return result;
    }
}
