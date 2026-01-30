import api from "./api";

export const fetchGroups = async () => {
  const res = await api.get("/api/groups");
  return res.data;
};
