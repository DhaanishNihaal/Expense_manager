package com.bezkoder.springjwt.groups.expenses;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // Get all expenses for a group
    List<Expense> findByGroupId(Long groupId);

    
}
