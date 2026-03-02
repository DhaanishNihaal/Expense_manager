package com.bezkoder.springjwt.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.security.core.Authentication;

import com.bezkoder.springjwt.chat.service.MessageService;
import com.bezkoder.springjwt.chat.dto.SendMessageDTO;
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

            messagingTemplate.convertAndSend(
                    "/topic/chat/" + dto.getChatId(),
                    savedMessage
            );
            System.out.println("Message saved and broadcasted: " + savedMessage.getId());
        } catch (Exception e) {
            System.err.println("Error in sendMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @MessageMapping("/chat.typing")
    public void typing(com.bezkoder.springjwt.chat.dto.TypingDTO dto, Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            Long userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + dto.getChatId() + "/typing",
                    userId
            );
        }
    }
}