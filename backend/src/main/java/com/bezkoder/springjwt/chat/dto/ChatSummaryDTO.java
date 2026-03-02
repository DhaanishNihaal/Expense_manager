package com.bezkoder.springjwt.chat.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class ChatSummaryDTO {

    private UUID chatId;
    private String chatType;
    private String displayName;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Long unreadCount;

    public ChatSummaryDTO(UUID chatId,
                          String chatType,
                          String displayName,
                          String lastMessage,
                          LocalDateTime lastMessageTime,
                          Long unreadCount) {
        this.chatId = chatId;
        this.chatType = chatType;
        this.displayName = displayName;
        this.lastMessage = lastMessage;
        this.lastMessageTime = lastMessageTime;
        this.unreadCount = unreadCount;
    }

    // getters
    public UUID getChatId() { return chatId; }
    public String getChatType() { return chatType; }
    public String getDisplayName() { return displayName; }
    public String getLastMessage() { return lastMessage; }
    public LocalDateTime getLastMessageTime() { return lastMessageTime; }
    public Long getUnreadCount() { return unreadCount; }
}