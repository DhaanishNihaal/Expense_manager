package com.bezkoder.springjwt.chat.controller;

import com.bezkoder.springjwt.chat.dto.ChatSummaryDTO;
import com.bezkoder.springjwt.chat.service.ChatService;
import com.bezkoder.springjwt.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/private/{otherUserId}")
    public UUID createPrivateChat(
            @PathVariable Long otherUserId,
            Authentication auth
    ) {
        Long currentUserId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        return chatService.createOrGetPrivateChat(currentUserId, otherUserId);
    }
    

    @GetMapping("/my")
    public List<ChatSummaryDTO> getMyChats(Authentication auth) {
        Long userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        return chatService.getUserChats(userId);
    }

    @GetMapping("/{chatId}/messages")
    public List<com.bezkoder.springjwt.chat.entity.Message> getChatMessages(@PathVariable UUID chatId) {
        return chatService.getChatMessages(chatId);
    }

    @PostMapping("/{chatId}/read")
    public void markRead(@PathVariable UUID chatId, Authentication auth) {
        Long userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        chatService.markAsRead(chatId, userId);
    }
}