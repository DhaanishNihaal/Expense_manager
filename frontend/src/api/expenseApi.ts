import api from "./api";
import { Expense } from "../types/expense";

export const fetchExpensesByGroup = async (
  groupId: number
): Promise<Expense[]> => {
  const res = await api.get<Expense[]>(
    `/api/groups/${groupId}/expenses`
  );
  return res.data;
};

export const addExpense = async (
  groupId: number,
  data: { title: string; description?: string; totalAmount: number }
) => {
  return await api.post(`/api/groups/${groupId}/expenses`, data);
};  