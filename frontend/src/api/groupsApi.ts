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

export const promoteAsAdmin = async (groupId: number, memberId: number) => {
  const res = await api.put(`/api/groups/${groupId}/promote/${memberId}`);
  return res.data;
};

export const demoteAsMember = async (groupId: number, memberId: number) => {
  const res = await api.put(`/api/groups/${groupId}/demote/${memberId}`);
  return res.data;
};
