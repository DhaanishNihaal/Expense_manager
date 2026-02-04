package com.bezkoder.springjwt.groups.expenses;

import com.bezkoder.springjwt.groups.expenses.dto.CreateTransactionRequest;
import com.bezkoder.springjwt.groups.expenses.dto.ExpenseTransactionResponse;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;

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
            CreateTransactionRequest request
    ) {

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        User payer = userRepository.findById(request.getPayerId())
                .orElseThrow(() -> new RuntimeException("Payer not found"));

        List<Long> receiverIds = request.getReceiverIds();
        if (receiverIds == null || receiverIds.isEmpty()) {
            throw new RuntimeException("Receivers required");
        }

        double splitAmount =
                request.getTotalAmount() / receiverIds.size();

        for (Long receiverId : receiverIds) {
            User receiver = userRepository.findById(receiverId)
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));

            ExpenseTransaction tx = new ExpenseTransaction();
            tx.setExpense(expense);
            tx.setPayer(payer);
            tx.setReceiver(receiver);
            tx.setAmount(splitAmount);

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