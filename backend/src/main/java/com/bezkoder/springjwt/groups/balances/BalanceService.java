package com.bezkoder.springjwt.groups.balance;

import com.bezkoder.springjwt.groups.expense.ExpenseTransaction;
import com.bezkoder.springjwt.groups.expense.ExpenseTransactionRepository;
import com.bezkoder.springjwt.groups.balance.dto.BalanceResponse;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class BalanceService{

    private final ExpenseTransactionRepository transactionRepository;

    public BalanceService(ExpenseTransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<BalanceResponse> calculateBalances(Long groupId) {

        List<ExpenseTransaction> transactions =
                transactionRepository.findAllByGroupId(groupId);

        // Key = "fromUserId_toUserId"
        Map<String, Double> balanceMap = new HashMap<>();

        for (ExpenseTransaction tx : transactions) {

            Long fromId = tx.getReceiver().getId();
            Long toId   = tx.getPayer().getId();

            // Ignore self-payments
            if (fromId.equals(toId)) continue;

            String key = fromId + "_" + toId;

            balanceMap.put(
                    key,
                    balanceMap.getOrDefault(key, 0.0) + tx.getAmount()
            );
        }

        // Convert map → response list
        List<BalanceResponse> result = new ArrayList<>();

        for (Map.Entry<String, Double> entry : balanceMap.entrySet()) {

            String[] parts = entry.getKey().split("_");
            Long fromId = Long.parseLong(parts[0]);
            Long toId   = Long.parseLong(parts[1]);

            result.add(
                new BalanceResponse(fromId, toId, entry.getValue())
            );
        }

        return result;
    }
}
