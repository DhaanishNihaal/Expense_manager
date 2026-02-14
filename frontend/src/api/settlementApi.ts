import api from "./api";

export type Settlement = {
  fromUserId: number;
  toUserId: number;
  fromUsername: string;
  toUsername: string;
  amount: number;
};

export const fetchExpenseSettlements = (expenseId: number) =>
  api.get<Settlement[]>(`/api/expenses/${expenseId}/settlements`);

export default {
  fetchExpenseSettlements,
};
