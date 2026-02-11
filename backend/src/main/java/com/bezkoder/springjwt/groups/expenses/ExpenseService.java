package com.bezkoder.springjwt.groups.expenses;

import com.bezkoder.springjwt.groups.Group;
import com.bezkoder.springjwt.groups.GroupMemberRepository;
import com.bezkoder.springjwt.groups.GroupRepository;
import com.bezkoder.springjwt.groups.expenses.dto.CreateExpenseRequest;
import com.bezkoder.springjwt.groups.expenses.dto.ExpenseTransactionResponse;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.bezkoder.springjwt.groups.expenses.dto.ExpenseResponse;
import java.util.List;  

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
        expense.setTitle(request.getTitle());
        expense.setDescription(request.getDescription());
        expense.setTotalAmount(request.getTotalAmount());
        expense.setCreatedBy(creator);

        Expense savedExpense = expenseRepository.save(expense);

        // 5️⃣ Create transactions
        
    }
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpensesByGroup(Long groupId, String username) {

    // 1️⃣ Get logged-in user
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

    // 2️⃣ Verify user belongs to the group
    boolean isMember = groupMemberRepository
            .existsByGroupIdAndUserId(groupId, user.getId());

    if (!isMember) {
        throw new RuntimeException("User is not a member of this group");
    }

    // 3️⃣ Fetch expenses of the group
    List<Expense> expenses = expenseRepository.findByGroupId(groupId);

    // 4️⃣ Map Expense → ExpenseResponse DTO
    return expenses.stream()
            .map(expense -> {
                ExpenseResponse response = new ExpenseResponse();
                response.setId(expense.getId());
                response.setTitle(expense.getTitle());
                response.setDescription(expense.getDescription());
                response.setTotalAmount(expense.getTotalAmount());
                response.setCreatedAt(expense.getCreatedAt());
                response.setCreatedByUsername(
                        expense.getCreatedBy().getUsername()
                );

                return response;
            })
            .toList();
    }

}
