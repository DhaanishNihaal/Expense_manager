package com.bezkoder.springjwt.groups.expense;

import com.bezkoder.springjwt.groups.expense.dto.ExpenseTransactionResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExpenseTransactionService {

    private final ExpenseTransactionRepository transactionRepository;

    public ExpenseTransactionService(ExpenseTransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<ExpenseTransactionResponse> getTransactionsByExpense(Long expenseId) {

        return transactionRepository.findByExpenseId(expenseId)
                .stream()
                .map(tx -> new ExpenseTransactionResponse(
                        tx.getPayer().getId(),
                        tx.getPayer().getName(),
                        tx.getReceiver().getId(),
                        tx.getReceiver().getName(),
                        tx.getAmount()
                ))
                .toList();
    }
}