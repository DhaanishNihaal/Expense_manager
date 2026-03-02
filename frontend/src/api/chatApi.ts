import api from "./api";

export interface ChatSummary {
    chatId: string;
    chatType: string;
    displayName: string;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
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

export default {
    createPrivateChat,
    getMyChats,
    getChatMessages,
    markAsRead,
};
