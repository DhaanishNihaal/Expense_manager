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
    
    public List<BalanceResponse> getUserBalances(String username) {
        List<ExpenseTransaction> transactions =
                transactionRepository.findByPayerUsernameOrReceiverUsername(username, username);
        return SettlementEngine.settle(transactions);
    }
    
    // 🔹 Private/Direct chat level
    public List<BalanceResponse> getPrivateBalances(String username1, String username2) {
        // Fetch all transactions involving user1
        List<ExpenseTransaction> transactions =
                transactionRepository.findByPayerUsernameOrReceiverUsername(username1, username1);
                
        // Filter to only include transactions where user2 is the other party
        List<ExpenseTransaction> filteredTransactions = transactions.stream()
            .filter(tx -> 
                (tx.getPayer().getUsername().equals(username1) && tx.getReceiver().getUsername().equals(username2)) ||
                (tx.getPayer().getUsername().equals(username2) && tx.getReceiver().getUsername().equals(username1))
            )
            .toList();
            
        return SettlementEngine.settle(filteredTransactions);
    }
    
}