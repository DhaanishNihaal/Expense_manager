package com.bezkoder.springjwt.chat.service;

import com.bezkoder.springjwt.chat.dto.SendMessageDTO;
import com.bezkoder.springjwt.chat.entity.Chat;
import com.bezkoder.springjwt.chat.entity.Message;
import com.bezkoder.springjwt.chat.entity.MessageType;
import com.bezkoder.springjwt.chat.entity.SettlementStatus;
import com.bezkoder.springjwt.chat.repository.ChatRepository;
import com.bezkoder.springjwt.chat.repository.MessageRepository;
import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

    public Message saveMessage(SendMessageDTO dto, Long senderId) {
        System.out.println("DEBUG: Saving message for chatId: " + dto.getChatId() + ", senderId: " + senderId);
        
        try {
            Chat chat = chatRepository.findById(dto.getChatId()).orElseThrow(() -> new RuntimeException("Chat not found with id: " + dto.getChatId()));
            User sender = userRepository.findById(senderId).orElseThrow(() -> new RuntimeException("Sender not found with id: " + senderId));

            Message message = new Message();
            message.setChat(chat);
            message.setSender(sender);
            message.setContent(dto.getContent());
            
            // Default to TEXT if null
            String type = (dto.getType() != null) ? dto.getType() : "TEXT";
            message.setType(MessageType.valueOf(type));

            if(message.getType() == MessageType.SETTLEMENT_REQUEST){
                message.setSettlementAmount(dto.getSettlementAmount());
                message.setSettlementStatus(SettlementStatus.PENDING);
            }

            Message saved = messageRepository.save(message);
            System.out.println("DEBUG: Message successfully saved with id: " + saved.getId());
            return saved;
        } catch (Exception e) {
            System.err.println("DEBUG ERROR: Failed to save message: " + e.getMessage());
            throw e;
        }
    }
}
