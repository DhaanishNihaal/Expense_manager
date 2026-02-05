import api from "./api";

/**
 * Get all transactions for a single expense
 * (who paid whom, how much)
 */
export const fetchExpenseTransactions= (expenseId: number) => {
  return api.get(`/api/expenses/${expenseId}/transactions`);
};

export const addExpenseTransaction = (expenseId: number, data: any) =>
  api.post(`/api/expenses/${expenseId}/transactions`, data);

export const deleteExpenseTransaction = (expenseId: number, transactionId: number) =>
  api.delete(`/api/expenses/${expenseId}/transactions/${transactionId}`);
