package com.bezkoder.springjwt.groups.expenses;

import com.bezkoder.springjwt.groups.expenses.dto.SettlementResponse;
import com.bezkoder.springjwt.models.User;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ExpenseSettlementService {

    private final ExpenseTransactionRepository transactionRepository;

    public ExpenseSettlementService(ExpenseTransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<SettlementResponse> getExpenseSettlements(Long expenseId) {

        List<ExpenseTransaction> transactions =
                transactionRepository.findByExpenseId(expenseId);

        Map<Long, Double> balances = new HashMap<>();
        Map<Long, String> userNames = new HashMap<>();

        // Step 1: Compute balances
        for (ExpenseTransaction tx : transactions) {

            User payer = tx.getPayer();
            User receiver = tx.getReceiver();

            double amount = tx.getAmount();

            balances.put(payer.getId(),
                    balances.getOrDefault(payer.getId(), 0.0) + amount);

            balances.put(receiver.getId(),
                    balances.getOrDefault(receiver.getId(), 0.0) - amount);

            userNames.put(payer.getId(), payer.getName());
            userNames.put(receiver.getId(), receiver.getName());
        }

        // Step 2: Separate creditors and debtors
        List<UserBalance> creditors = new ArrayList<>();
        List<UserBalance> debtors = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : balances.entrySet()) {

            if (entry.getValue() > 0)
                creditors.add(new UserBalance(entry.getKey(), entry.getValue()));

            else if (entry.getValue() < 0)
                debtors.add(new UserBalance(entry.getKey(), -entry.getValue()));
        }

        // Step 3: Greedy settlement
        List<SettlementResponse> settlements = new ArrayList<>();

        int i = 0, j = 0;

        while (i < debtors.size() && j < creditors.size()) {

            UserBalance debtor = debtors.get(i);
            UserBalance creditor = creditors.get(j);

            double amount = Math.min(debtor.amount, creditor.amount);

            settlements.add(
                    new SettlementResponse(
                            debtor.userId,
                            creditor.userId,
                            userNames.get(debtor.userId),
                            userNames.get(creditor.userId),
                            round(amount)
                    )
            );

            debtor.amount -= amount;
            creditor.amount -= amount;

            if (Math.abs(debtor.amount) < 0.01) i++;
            if (Math.abs(creditor.amount) < 0.01) j++;
        }

        return settlements;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // Helper inner class
    private static class UserBalance {
        Long userId;
        double amount;

        UserBalance(Long userId, double amount) {
            this.userId = userId;
            this.amount = amount;
        }
    }
}