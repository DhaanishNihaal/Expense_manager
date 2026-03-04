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
    private Long otherUserId; // Add other user ID for online status

    public ChatSummaryDTO(UUID chatId,
                          String chatType,
                          String displayName,
                          String lastMessage,
                          LocalDateTime lastMessageTime,
                          Long unreadCount,
                          Long otherUserId) {
        this.chatId = chatId;
        this.chatType = chatType;
        this.displayName = displayName;
        this.lastMessage = lastMessage;
        this.lastMessageTime = lastMessageTime;
        this.unreadCount = unreadCount;
        this.otherUserId = otherUserId;
    }

    // getters
    public UUID getChatId() { return chatId; }
    public String getChatType() { return chatType; }
    public String getDisplayName() { return displayName; }
    public String getLastMessage() { return lastMessage; }
    public LocalDateTime getLastMessageTime() { return lastMessageTime; }
    public Long getUnreadCount() { return unreadCount; }
    public Long getOtherUserId() { return otherUserId; } // Add getter for other user ID
}