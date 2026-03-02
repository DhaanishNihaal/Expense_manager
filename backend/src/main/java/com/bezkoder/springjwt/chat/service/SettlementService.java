package com.bezkoder.springjwt.chat.service;

import com.bezkoder.springjwt.chat.entity.Message;
import com.bezkoder.springjwt.chat.entity.SettlementStatus;
import com.bezkoder.springjwt.chat.repository.MessageRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final MessageRepository messageRepository;

    public void acceptSettlement(UUID messageId) {
        Message message = messageRepository.findById(messageId).orElseThrow();
        message.setSettlementStatus(SettlementStatus.ACCEPTED);
        messageRepository.save(message);
    }
}
