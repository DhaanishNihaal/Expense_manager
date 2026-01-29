import api from "../api/api";
import { saveToken, removeToken } from "../utils/storage";

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export const login = async (username: string, password: string) => {
  const response = await api.post<LoginResponse>("/api/auth/signin", {
    username,
    password,
  });

  const token = response.data.accessToken;

  await saveToken(token);

  return response.data;
};

export const logout = async () => {
  await removeToken();
};
