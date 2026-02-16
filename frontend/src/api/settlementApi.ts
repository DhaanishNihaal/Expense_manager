import api from "./api";

export type Settlement = {
  fromUserId: number;
  toUserId: number;
  fromname: string;
  toname: string;
  amount: number;
};

export const fetchExpenseSettlements = (expenseId: number) =>
  api.get<Settlement[]>(`/api/expenses/${expenseId}/settlements`);

export const fetchGroupSettlements = (groupId: number) =>
  api.get<Settlement[]>(`/api/groups/${groupId}/settlements`);

export default {
  fetchExpenseSettlements,
  fetchGroupSettlements,
};
