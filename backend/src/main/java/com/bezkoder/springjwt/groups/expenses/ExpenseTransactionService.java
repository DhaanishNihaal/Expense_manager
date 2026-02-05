package com.bezkoder.springjwt.groups.expenses;

import com.bezkoder.springjwt.groups.expenses.dto.CreateTransactionRequest;
import com.bezkoder.springjwt.groups.expenses.dto.ExpenseTransactionResponse;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;

import java.math.BigDecimal;
import java.math.RoundingMode;
@Service
public class ExpenseTransactionService {

    private final ExpenseTransactionRepository transactionRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    

    public ExpenseTransactionService(
            ExpenseTransactionRepository transactionRepository,
            ExpenseRepository expenseRepository,
            UserRepository userRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    // ============================
    // GET transactions by expense
    // ============================
    public List<ExpenseTransactionResponse> getTransactionsByExpense(Long expenseId) {

        return transactionRepository.findByExpenseId(expenseId)
                .stream()
                .map(tx -> new ExpenseTransactionResponse(
                        tx.getId(),
                        tx.getPayer().getId(),
                        tx.getPayer().getName(),
                        tx.getReceiver().getId(),
                        tx.getReceiver().getName(),
                        tx.getAmount()
                ))
                .toList();
    }

    // ============================
    // ADD transaction (split logic)
    // ============================
    @Transactional
    public void addTransaction(
        Long expenseId,
        String username,
        CreateTransactionRequest request
) {
    User payer = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

    Expense expense = expenseRepository.findById(expenseId)
            .orElseThrow(() -> new RuntimeException("Expense not found"));

    int receiverCount = request.getReceiverIds().size();


    BigDecimal total = BigDecimal.valueOf(request.getTotalAmount());

    // base split rounded DOWN to 2 decimals
    BigDecimal base =
        total.divide(
            BigDecimal.valueOf(receiverCount),
            2,
            RoundingMode.DOWN
        );

    // base × count
    BigDecimal assigned =
        base.multiply(BigDecimal.valueOf(receiverCount));

    // exact remainder
    BigDecimal remainder = total.subtract(assigned);

    for (int i = 0; i < receiverCount; i++) {

        BigDecimal amount = base;

        // last receiver absorbs remainder
        if (i == receiverCount - 1) {
        amount = amount.add(remainder);
        }

        ExpenseTransaction tx = new ExpenseTransaction();
        tx.setExpense(expense);
        tx.setPayer(payer);
        tx.setReceiver(userRepository.findById(request.getReceiverIds().get(i)).orElseThrow());
        tx.setAmount(amount.doubleValue()); // DB still double is fine
        transactionRepository.save(tx);
        }
    }
    // ============================
    // DELETE transaction
    // ============================
    @Transactional
    public void deleteTransaction(
            Long expenseId,
            Long transactionId
    ) {

        ExpenseTransaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        // Safety check: ensure transaction belongs to the expense
        if (!tx.getExpense().getId().equals(expenseId)) {
            throw new RuntimeException("Transaction does not belong to this expense");
        }

        transactionRepository.delete(tx);
    }
}