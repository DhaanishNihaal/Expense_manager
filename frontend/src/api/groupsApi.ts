import api from "./api";
import { User } from "@/src/types/user";

export const fetchGroups = async () => {
  const res = await api.get("/api/groups");
  return res.data;
};

export const fetchGroupMembers = async (groupId: number): Promise<User[]> => {
  const res = await api.get(`/api/groups/${groupId}`);
  // Extract members array from the group object
  return res.data.members || [];
};
