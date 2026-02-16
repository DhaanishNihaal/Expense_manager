package com.bezkoder.springjwt.groups.balances;
import com.bezkoder.springjwt.groups.balances.dto.BalanceResponse;
import com.bezkoder.springjwt.groups.expenses.ExpenseTransaction;
import com.bezkoder.springjwt.models.User;

import java.util.*;

public class SettlementEngine {

    public static List<BalanceResponse> settle(List<ExpenseTransaction> transactions) {

        // Step 1: Compute net balance per user
        Map<Long, Double> balances = new HashMap<>();
        Map<Long, User> userMap = new HashMap<>();

        for (ExpenseTransaction tx : transactions) {

            User payer = tx.getPayer();
            User receiver = tx.getReceiver();

            Long payerId = payer.getId();
            Long receiverId = receiver.getId();
            Double amount = tx.getAmount();

            userMap.put(payerId, payer);
            userMap.put(receiverId, receiver);

            balances.put(payerId,
                    balances.getOrDefault(payerId, 0.0) + amount);

            balances.put(receiverId,
                    balances.getOrDefault(receiverId, 0.0) - amount);
        }

        // Step 2: Separate creditors and debtors
        List<Map.Entry<Long, Double>> creditors = new ArrayList<>();
        List<Map.Entry<Long, Double>> debtors = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : balances.entrySet()) {
            if (entry.getValue() > 0)
                creditors.add(entry);
            else if (entry.getValue() < 0)
                debtors.add(entry);
        }

        // Step 3: Greedy settlement
        List<BalanceResponse> settlements = new ArrayList<>();

        int i = 0, j = 0;

        while (i < debtors.size() && j < creditors.size()) {

            Long debtorId = debtors.get(i).getKey();
            Long creditorId = creditors.get(j).getKey();

            double debtAmount = -debtors.get(i).getValue();
            double creditAmount = creditors.get(j).getValue();

            double settleAmount = Math.min(debtAmount, creditAmount);

            User debtor = userMap.get(debtorId);
            User creditor = userMap.get(creditorId);

            settlements.add(
                    new BalanceResponse(
                            debtorId,
                            creditorId,
                            debtor.getName(),
                            creditor.getName(),
                            roundToTwoDecimals(settleAmount)
                    )
            );

            debtors.get(i).setValue(debtors.get(i).getValue() + settleAmount);
            creditors.get(j).setValue(creditors.get(j).getValue() - settleAmount);

            if (Math.abs(debtors.get(i).getValue()) < 0.01) i++;
            if (Math.abs(creditors.get(j).getValue()) < 0.01) j++;
        }

        return settlements;
    }

    private static double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}