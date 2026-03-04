package com.bezkoder.springjwt.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.security.core.Authentication;

import com.bezkoder.springjwt.chat.service.MessageService;
import com.bezkoder.springjwt.chat.dto.SendMessageDTO;
import com.bezkoder.springjwt.chat.dto.TypingDTO;
import com.bezkoder.springjwt.chat.dto.PresenceDTO;
import com.bezkoder.springjwt.security.services.UserDetailsImpl;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(SendMessageDTO dto, Authentication auth) {
        System.out.println("Received message request: " + dto.getContent() + " for chat " + dto.getChatId());
        
        Long senderId = null;
        try {
            if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
                senderId = ((UserDetailsImpl) auth.getPrincipal()).getId();
                System.out.println("Authenticated sender id: " + senderId);
            } else if (dto.getSenderId() != null) {
                senderId = dto.getSenderId();
                System.out.println("Using sender id from DTO: " + senderId);
            } else {
                System.err.println("No sender ID found in Auth or DTO!");
                return;
            }

            var savedMessage = messageService.saveMessage(dto, senderId);

            // Create a simplified message object for broadcasting
            var broadcastMessage = new java.util.HashMap<String, Object>();
            broadcastMessage.put("id", savedMessage.getId().toString());
            broadcastMessage.put("content", savedMessage.getContent());
            broadcastMessage.put("sender", java.util.Map.of(
                "id", savedMessage.getSender().getId(),
                "name", savedMessage.getSender().getName()
            ));
            broadcastMessage.put("timestamp", savedMessage.getTimestamp().toString());
            broadcastMessage.put("type", savedMessage.getType().toString());
            broadcastMessage.put("chatId", dto.getChatId().toString());

            // Broadcast to specific chat
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + dto.getChatId(),
                    broadcastMessage
            );
            
            // Also broadcast to global topic for background message handling
            messagingTemplate.convertAndSend(
                    "/topic/messages",
                    broadcastMessage
            );
            
            System.out.println("Message saved and broadcasted: " + savedMessage.getId());
        } catch (Exception e) {
            System.err.println("Error in sendMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @MessageMapping("/chat.typing")
    public void typing(com.bezkoder.springjwt.chat.dto.TypingDTO dto, Authentication auth) {
        Long userId = null;
        
        // Try to get userId from DTO first
        if (dto.getUserId() != null) {
            userId = dto.getUserId();
        } else if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        
        if (userId != null) {
            System.out.println("Typing event received: userId=" + userId + ", chatId=" + dto.getChatId());
            
            // Broadcast to specific chat
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + dto.getChatId() + "/typing",
                    userId
            );
            
            // Also broadcast to global topic for real-time updates
            var typingData = new java.util.HashMap<String, Object>();
            typingData.put("chatId", dto.getChatId().toString());
            typingData.put("userId", userId);
            
            messagingTemplate.convertAndSend(
                    "/topic/typing",
                    typingData
            );
        }
    }

    @MessageMapping("/chat.presence")
    public void presence(PresenceDTO dto, Authentication auth) {
        Long userId = null;
        
        // Try to get userId from DTO first
        if (dto.getUserId() != null) {
            userId = dto.getUserId();
        } else if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        
        if (userId != null) {
            System.out.println("=== PRESENCE EVENT RECEIVED ===");
            System.out.println("UserId: " + userId);
            System.out.println("Status: " + dto.getStatus());
            System.out.println("================================");
            
            // Broadcast to global topic for real-time updates
            var presenceData = new java.util.HashMap<String, Object>();
            presenceData.put("userId", userId);
            presenceData.put("status", dto.getStatus());
            
            System.out.println("Broadcasting presence to /topic/presence: " + presenceData);
            
            messagingTemplate.convertAndSend(
                    "/topic/presence",
                    presenceData
            );
            
            System.out.println("Presence broadcast sent successfully");
        } else {
            System.err.println("Presence event received but no userId found!");
        }
    }
}