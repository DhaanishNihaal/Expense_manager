package com.bezkoder.springjwt.groups.expense;

import com.bezkoder.springjwt.groups.Group;
import com.bezkoder.springjwt.groups.GroupMemberRepository;
import com.bezkoder.springjwt.groups.GroupRepository;
import com.bezkoder.springjwt.groups.expense.dto.CreateExpenseRequest;
import com.bezkoder.springjwt.groups.expense.dto.ExpenseTransactionRequest;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseTransactionRepository transactionRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            ExpenseTransactionRepository transactionRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository,
            GroupRepository groupRepository) {

        this.expenseRepository = expenseRepository;
        this.transactionRepository = transactionRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
    }

    @Transactional
    public void createExpense(Long groupId,
                              CreateExpenseRequest request,
                              String creatorUsername) {

        // 1️⃣ Validate creator
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new RuntimeException("Creator not found"));

        // 2️⃣ Validate group
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // 3️⃣ Check creator is group member
        groupMemberRepository.findByGroupIdAndUserId(groupId, creator.getId())
                .orElseThrow(() -> new RuntimeException("Not a group member"));

        // 4️⃣ Create Expense
        Expense expense = new Expense();
        expense.setGroup(group);
        expense.setDescription(request.getDescription());
        expense.setCreatedBy(creator);

        Expense savedExpense = expenseRepository.save(expense);

        // 5️⃣ Create transactions
        for (ExpenseTransactionRequest tx : request.getTransactions()) {

            User payer = userRepository.findByUsername(tx.getPayerUsername())
                    .orElseThrow(() -> new RuntimeException("Payer not found"));

            User receiver = userRepository.findByUsername(tx.getReceiverUsername())
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));

            // Validate both belong to group
            groupMemberRepository.findByGroupIdAndUserId(groupId, payer.getId())
                    .orElseThrow(() -> new RuntimeException("Payer not in group"));

            groupMemberRepository.findByGroupIdAndUserId(groupId, receiver.getId())
                    .orElseThrow(() -> new RuntimeException("Receiver not in group"));

            ExpenseTransaction transaction = new ExpenseTransaction();
            transaction.setExpense(savedExpense);
            transaction.setPayer(payer);
            transaction.setReceiver(receiver);
            transaction.setAmount(tx.getAmount());

            transactionRepository.save(transaction);
        }
    }
}
