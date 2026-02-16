import api from "./api";

/**
 * Get expense details including group ID
 */
export const fetchExpenseDetails = (expenseId: number) => {
  return api.get(`/api/expenses/${expenseId}`);
};

/**
 * Get all transactions for a single expense
 * (who paid whom, how much)
 */
export const fetchExpenseTransactions= (expenseId: number) => {
  return api.get(`/api/expenses/${expenseId}/transactions`);
};

export const addExpenseTransaction = (expenseId: number, data: any) =>
  api.post(`/api/expenses/${expenseId}/transactions`, data);

export const deletePayment = (expenseId: number, paymentGroupId: string) =>{
  return api.delete(`/api/expenses/${expenseId}/payments/${paymentGroupId}`);
}
