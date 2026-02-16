import api from "../api/api";

import { saveToken, removeToken } from "../utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  await AsyncStorage.setItem("user", JSON.stringify({
    id: response.data.id,
    username: response.data.username,
    email: response.data.email,
    roles: response.data.roles,
  }));

  return response.data;
};

export const logout = async () => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
};
