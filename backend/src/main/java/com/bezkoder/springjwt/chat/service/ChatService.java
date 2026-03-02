package com.bezkoder.springjwt.chat.service;

import com.bezkoder.springjwt.chat.dto.ChatSummaryDTO;
import com.bezkoder.springjwt.chat.entity.Chat;
import com.bezkoder.springjwt.chat.entity.ChatMember;
import com.bezkoder.springjwt.chat.entity.ChatType;
import com.bezkoder.springjwt.chat.entity.Message;
import com.bezkoder.springjwt.chat.repository.ChatMemberRepository;
import com.bezkoder.springjwt.chat.repository.ChatRepository;
import com.bezkoder.springjwt.chat.repository.MessageRepository;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public UUID createOrGetPrivateChat(Long user1Id, Long user2Id) {
        if (user1Id.equals(user2Id)) {
            throw new RuntimeException("Cannot create chat with yourself");
        }

        Optional<Chat> existing = chatRepository.findPrivateChat(user1Id, user2Id);
        if (existing.isPresent()) {
            return existing.get().getId();
        }

        Chat chat = new Chat();
        chat.setType(ChatType.PRIVATE);
        chat = chatRepository.save(chat);

        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new RuntimeException("User1 not found"));
        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new RuntimeException("User2 not found"));

        ChatMember cm1 = new ChatMember();
        cm1.setChat(chat);
        cm1.setUser(user1);

        ChatMember cm2 = new ChatMember();
        cm2.setChat(chat);
        cm2.setUser(user2);

        chatMemberRepository.save(cm1);
        chatMemberRepository.save(cm2);

        return chat.getId();
    }

    public Chat getChatById(UUID chatId) {
        return chatRepository.findById(chatId).orElseThrow(() -> new RuntimeException("Chat not found"));
    }

    @Transactional(readOnly = true)
    public List<ChatSummaryDTO> getUserChats(Long userId) {
        List<ChatMember> memberships = chatMemberRepository.findByUserId(userId);

        return memberships.stream().map(member -> {
            Chat chat = member.getChat();

            Optional<Message> lastMsg = messageRepository.findTopByChatIdOrderByTimestampDesc(chat.getId());
            String lastMessage = lastMsg.map(Message::getContent).orElse(null);
            LocalDateTime lastTime = lastMsg.map(Message::getTimestamp).orElse(null);

            String displayName;
            if (chat.getType() == ChatType.PRIVATE) {
                List<ChatMember> allMembers = chatMemberRepository.findByChatId(chat.getId());
                User otherUser = allMembers.stream()
                        .map(ChatMember::getUser)
                        .filter(u -> !u.getId().equals(userId))
                        .findFirst()
                        .orElse(null);

                displayName = (otherUser != null) ? otherUser.getName() : "Unknown";
            } else {
                displayName = (chat.getGroup() != null) ? chat.getGroup().getName() : "Unknown Group";
            }

            Long unreadCount = messageRepository.countUnread(chat.getId(), userId);

            return new ChatSummaryDTO(
                    chat.getId(),
                    chat.getType().name(),
                    displayName,
                    lastMessage,
                    lastTime,
                    unreadCount
            );
        })
        .sorted((c1, c2) -> {
            LocalDateTime t1 = c1.getLastMessageTime();
            LocalDateTime t2 = c2.getLastMessageTime();

            // Default to chat creation time if no messages (we need to fetch it though)
            // For now, let's just use the current time if null to put them at top, 
            // OR fetch Chat entity again. Better to just use a very old date if null to put at bottom.
            if (t1 == null) t1 = LocalDateTime.MIN;
            if (t2 == null) t2 = LocalDateTime.MIN;

            return t2.compareTo(t1);
        })
        .toList();
    }

    @Transactional
    public void markAsRead(UUID chatId, Long userId) {
        messageRepository.markMessagesAsRead(chatId, userId);
    }

    public List<Message> getChatMessages(UUID chatId) {
        return messageRepository.findAllByChatIdOrderByTimestampAsc(chatId);
    }
}
