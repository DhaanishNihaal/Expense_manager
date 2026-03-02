import api from "./api";

export interface UserSearchResponse {
    id: number;
    username: string;
    name: string;
}

export const searchUsers = (keyword: string, groupId: number = 0) => {
    return api.get<UserSearchResponse[]>(`/api/users/search`, {
        params: { keyword, groupId }
    });
};

export default {
    searchUsers,
};
