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

export const fetchPrivateSettlements = (username: string) =>
  api.get<Settlement[]>(`/api/balances/private/${username}`);

export const fetchMySettlements = () =>
  api.get<Settlement[]>("/api/users/me/settlements");

export const paySettlement = (receiverId: number, amount: number, groupId?: number) =>
  api.post(`/api/settlement/pay`, { receiverId, amount, groupId });

export default {
  fetchExpenseSettlements,
  fetchGroupSettlements,
  fetchPrivateSettlements,
  fetchMySettlements,
  paySettlement,
};
