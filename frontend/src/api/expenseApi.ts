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