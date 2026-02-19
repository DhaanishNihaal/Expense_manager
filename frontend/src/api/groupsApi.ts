import api from "./api";
import { User } from "@/src/types/user";

export const fetchGroups = async () => {
  const res = await api.get("/api/groups");
  return res.data;
};

export const fetchGroupMembers = async (groupId: number): Promise<User[]> => {
  const res = await api.get(`/api/groups/${groupId}`);
  return res.data.members || [];
};

export const createGroup = async (name: string, description: string) => {
  const res = await api.post("/api/groups", { name, description });
  return res.data;
};
