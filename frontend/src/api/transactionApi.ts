import api from "./api";

/**
 * Get all transactions for a single expense
 * (who paid whom, how much)
 */
export const fetchExpenseTransactions= (expenseId: number) => {
  return api.get(`/api/expenses/${expenseId}/transactions`);
};