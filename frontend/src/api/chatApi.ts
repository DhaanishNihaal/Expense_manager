import api from "./api";

export interface ChatSummary {
    chatId: string;
    chatType: string;
    displayName: string;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
    otherUserId?: number; // Add other user ID for online status
}

export const createPrivateChat = (otherUserId: number) => {
    return api.post<string>(`/api/chat/private/${otherUserId}`);
};

export const getMyChats = () => {
    return api.get<ChatSummary[]>("/api/chat/my");
};

export const getChatMessages = (chatId: string) => {
    return api.get<any[]>(`/api/chat/${chatId}/messages`);
};

export const markAsRead = (chatId: string) => {
    return api.post(`/api/chat/${chatId}/read`);
};

export const getGroupChatId = (groupId: number) => {
    return api.get<string>(`/api/chat/group/${groupId}`);
};

export const getUserInfo = (userId: number) => {
    return api.get<any>(`/api/users/${userId}`);
};

export const getChatParticipants = (chatId: string) => {
    return api.get<any>(`/api/chat/${chatId}/participants`);
};

export default {
    createPrivateChat,
    getMyChats,
    getChatMessages,
    markAsRead,
    getGroupChatId,
    getUserInfo,
    getChatParticipants,
};
