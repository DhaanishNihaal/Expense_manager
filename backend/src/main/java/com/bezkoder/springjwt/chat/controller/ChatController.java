package com.bezkoder.springjwt.chat.controller;

import com.bezkoder.springjwt.chat.dto.ChatSummaryDTO;
import com.bezkoder.springjwt.chat.service.ChatService;
import com.bezkoder.springjwt.security.services.UserDetailsImpl;
import com.bezkoder.springjwt.repository.UserSearchResponse;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.chat.entity.ChatMember;
import com.bezkoder.springjwt.chat.entity.Chat;
import com.bezkoder.springjwt.chat.entity.ChatType;
import com.bezkoder.springjwt.chat.repository.ChatMemberRepository;
import com.bezkoder.springjwt.chat.repository.ChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final ChatMemberRepository chatMemberRepository;
    private final ChatRepository chatRepository;

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

    @GetMapping("/{chatId}/info")
    public ResponseEntity<Map<String, Object>> getChatInfo(@PathVariable String chatId, Authentication auth) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            Long currentUserId = userDetails.getId();
            
            UUID chatUuid = UUID.fromString(chatId);
            Chat chat = chatRepository.findById(chatUuid)
                    .orElseThrow(() -> new RuntimeException("Chat not found"));
            
            // Check if user is a member of this chat
            boolean isMember = chatMemberRepository.existsByChatIdAndUserId(chatUuid, currentUserId);
            if (!isMember) {
                return ResponseEntity.status(403).build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("type", chat.getType().toString());
            
            if (chat.getType() == ChatType.GROUP && chat.getGroup() != null) {
                response.put("groupName", chat.getGroup().getName());
                response.put("groupId", chat.getGroup().getId());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{chatId}/participants")
    public ResponseEntity<List<UserSearchResponse>> getChatParticipants(@PathVariable String chatId, Authentication auth) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            Long currentUserId = userDetails.getId();
            
            System.out.println("=== CHAT PARTICIPANTS DEBUG ===");
            System.out.println("Chat ID: " + chatId);
            System.out.println("Current User ID: " + currentUserId);
            
            // Get chat members
            List<ChatMember> members = chatMemberRepository.findByChatId(UUID.fromString(chatId));
            System.out.println("Total members found: " + members.size());
            
            // Find other user (not current user)
            User otherUser = null;
            for (ChatMember member : members) {
                User user = member.getUser();
                System.out.println("Checking member: " + user.getId() + " - " + user.getName());
                
                if (!user.getId().equals(currentUserId)) {
                    otherUser = user;
                    System.out.println("Found other user: " + user.getId() + " - " + user.getName());
                    break;
                } else {
                    System.out.println("Skipping current user: " + user.getId() + " - " + user.getName());
                }
            }
            
            if (otherUser != null) {
                System.out.println("✅ Returning other user: " + otherUser.getId() + " - " + otherUser.getName());
                UserSearchResponse response = new UserSearchResponse(
                        otherUser.getId(),
                        otherUser.getUsername(),
                        otherUser.getName()
                );
                return ResponseEntity.ok(List.of(response));
            } else {
                System.out.println("❌ No other user found in chat!");
                // Return empty list instead of bad request
                return ResponseEntity.ok(List.of());
            }
            
        } catch (Exception e) {
            System.err.println("Error in getChatParticipants: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{chatId}/read")
    public void markRead(@PathVariable UUID chatId, Authentication auth) {
        Long userId = ((UserDetailsImpl) auth.getPrincipal()).getId();
        chatService.markAsRead(chatId, userId);
    }

    @GetMapping("/group/{groupId}")
    public UUID getGroupChatId(@PathVariable Long groupId) {
        return chatService.getGroupChatId(groupId);
    }
}